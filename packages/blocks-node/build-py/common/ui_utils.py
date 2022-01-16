import pyspark.files
from typing import Dict, List, Any, Tuple, Pattern, Match, Optional, Set
import itertools
from pyspark.sql.functions import spark_partition_id
import pyspark.sql.functions as F
import pyspark.sql.types as T
import json
import logging
import re
import os

# get schema along with table aliases
# this hides in the output of the LogicalPlan under a qualifier


def get_schema_with_aliases(df, format=None):
    plan = df._jdf.queryExecution().analyzed()
    iterator = plan.output().iterator()
    output_fields: List[Any] = []
    while iterator.hasNext():
        # loop over the output fields, scala-style
        field = iterator.next()
        alias = ""
        # alias hides in the qualifier
        if field.qualifier().length() > 0:
            alias = field.qualifier().apply(0)

        output_fields.append({
            "tablealias": alias,
            "dataType": field.dataType().typeName(),
            "name": field.name()
        })

    if format == "json":
        return json.dumps({"fields": sorted(output_fields, key=lambda k: k['name'])})
    else:
        return output_fields


def repartition(df, sample_size=200, partition_size=128):
    # estimate size of uncompressed df
    size_mb = df.count()/sample_size * \
        df.limit(sample_size).toPandas().memory_usage(
            deep=True).sum()/1024/1024
    num_partitions = max(round(size_mb/partition_size), 1)
    return df.repartition(num_partitions)


def get_df_slice(spark, full_df, from_row=1, to_row=1, columns="*"):
    # get the aliases and change the names of the columns to show the aliases
    # this avoids duplicate columns
    df = full_df.select(columns)
    # TODO: this needs better handling of these aliases on the sort and aggregation side. handle then reinstate
    # aliased_schema = get_schema_with_aliases(df)
    # renamed_schema_fields = []
    # for i in range(len(aliased_schema)):
    #     aliased_field = aliased_schema[i]
    #     fieldname: str = ""
    #     if aliased_field["tablealias"] != "":
    #         fieldname = aliased_field["tablealias"]+"."+aliased_field["name"]
    #     else:
    #         fieldname = aliased_field["name"]
    #     renamed_schema_fields.append(fieldname)

    # # see if we have any results
    # renamed_df = df.toDF(*renamed_schema_fields)
    renamed_df = df

    #
    # get partition counts
    partition_counts = renamed_df.select(F.lit(1)).rdd.glom().map(len).collect()
    if sum(partition_counts) < (to_row-from_row)*2:
        # just return the entire thing. no need to optimize
        return df.collect()[from_row:to_row]
    # for r in df.select(spark_partition_id().alias("partition_id")).groupBy("partition_id").count().collect():
    #     partition_counts[r["partition_id"]] = r["count"]

    # find start partition and end partition
    start_partition = next(i for i, v in enumerate(
        itertools.accumulate(partition_counts)) if v > from_row)
    # end partition may be last one. catch stopiteration for that.
    try:
        end_partition = next(i for i, v in enumerate(
            itertools.accumulate(partition_counts)) if v > to_row)
    except StopIteration:
        end_partition = len(partition_counts)-1

    cum_counts_from = [0]+list(itertools.accumulate(partition_counts))[:-1]

    rows = []

    # loop over partitions and get the rows we need
    def fetch(fromp, top, iter):
        for counter, val in enumerate(iter):
            if counter >= top:
                break
            if counter >= fromp:
                yield val

    for partition in range(start_partition, end_partition+1):
        if partition_counts[partition] > 0:
            from_row_in_partition = max(from_row-cum_counts_from[partition], 0)
            to_row_in_partition = min(
                to_row-cum_counts_from[partition], partition_counts[partition])
            print(partition, from_row_in_partition, to_row_in_partition)
            # processor = partial(
            # fetch, from_row_in_partition, to_row_in_partition)
            partition_rows = spark.sparkContext.runJob(
                renamed_df.rdd, lambda iter: fetch(from_row_in_partition, to_row_in_partition, iter), [partition])
            rows.extend(partition_rows)

    return rows


def get_df_view(df, column_pivot=None, row_pivots=[], sort=[], aggregates={}):
    sort_clause = []

    if column_pivot is not None:
        # pivot table
        delimiter = ":::"
        # Hack notice: we need the dummy column to force spark to generate unique prefixed names for columns

        # create aggregates clause
        agg_clause = []
        for column, agg in aggregates.items():
            # special handling where this is a string column and we are doing a count. to avoid reading in huge data from parquet, we only count number of non-null values
            if df.schema[column.split(".")[-1]].dataType == T.StringType() and agg == "count":
                agg_clause.append(
                    F.count(F.isnull(F.col(column))).alias(f"{delimiter}{column}"))
            else:
                agg_clause.append(
                    F.expr(f"{agg}(`{column}`)").alias(f"{delimiter}{column}")
                )

        df_group = df.groupBy(row_pivots).pivot(column_pivot).agg(
            *agg_clause, F.lit(1).alias(delimiter+"dummy")
        )
        # rename the columns to what we need
        rollup_agg_clause = [F.sum(F.col(column)).alias(
            f"{column.split('_'+delimiter)[0]}|{column.split('_'+delimiter)[1]}")
            for column in df_group.columns
            if delimiter in column and delimiter + "dummy" not in column]
        df_rollup = df_group.rollup(row_pivots).agg(*rollup_agg_clause)
        # fill missing values with 0
        df_rollup = df_rollup.fillna(0)

        # sort the rollup so that the total are always first
        sort_clause.extend(row_pivots[:-1])
        sort_clause.append(
            F.when(F.col(row_pivots[-1]).isNull(),
                   F.lit(0)).otherwise(F.lit(1))
        )

        df_return = df_rollup
    elif len(row_pivots) > 0:
        # only a groupby (not a pivot)
        # create aggregates clause
        agg_clause = []
        for column, agg in aggregates.items():
            # we don't aggregate columns that are part of the pivot
            if column not in row_pivots:
                # special handling where this is a string column and we are doing a count. to avoid reading in huge data from parquet, we only count number of non-null values
                if df.schema[column.split(".")[-1]].dataType == T.StringType() and agg == "count":
                    agg_clause.append(
                        F.count(F.isnull(F.col(column))).alias(column))
                else:
                    agg_clause.append(
                        F.expr(f"{agg}(`{column}`)").alias(column)
                    )

        # sort the rollup so that the total are always first
        sort_clause.extend(row_pivots[:-1])
        sort_clause.append(
            F.when(F.col(row_pivots[-1]).isNull(),
                   F.lit(0)).otherwise(F.lit(1))
        )

        df_rollup = df.rollup(row_pivots).agg(*agg_clause)
        df_return = df_rollup
    else:
        # regular dataframe
        df_return = df

    # add general sort
    if len(sort) > 0:
        for sort_entry in sort:
            if sort_entry[1] == "desc":
                sort_clause.append(F.col(sort_entry[0]).desc())
            elif sort_entry[1] == "asc":
                sort_clause.append(F.col(sort_entry[0]))

    if len(sort_clause) > 0:
        df_return = df_return.orderBy(sort_clause)

    return df_return
