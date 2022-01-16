import pyspark.sql
import pyspark.sql.functions as F
import pyspark.sql.types as T
import logging
import collections
from typing import List
import functools
import operator
logger = logging.getLogger("dy_runner")


Delta = collections.namedtuple('Delta', 'insert update delete exclude')


def find_delta(
    df_existing,
    df_incoming,
    business_keys: List[str],
    columns: List[str],
    include_deletes: bool = False,
    exclusion_condition: str = ""
):
    join_condition = functools.reduce(
        operator.and_,
        [
            F.col(f"incoming.`{colname}`") == F.col(f"existing.`{colname}`") for colname in business_keys
        ]
    )

    # check if we need to include deletes. these are more costly since need to scan entire existing set
    join_type = "leftouter"
    if include_deletes:
        join_type = "fullouter"
    _all_rows = df_incoming.alias("incoming").join(df_existing.alias("existing"), join_condition, join_type)

    #
    # inserts - ones that didn't match existing business keys
    #
    df_insert = _all_rows.filter(
        functools.reduce(
            operator.and_,
            [
                F.col(f"existing.`{colname}`").isNull() for colname in business_keys
            ]
        )
    ).select("incoming.*")

    #
    # deletes
    #
    if include_deletes:
        # deletes are ones that didn't match incoming business keys
        df_delete = _all_rows.filter(
            functools.reduce(
                operator.and_,
                [
                    F.col(f"incoming.`{colname}`").isNull() for colname in business_keys
                ]
            )
        ).select("existing.*")
    else:
        df_delete = None
    #
    # updates - ones that matched all business keys
    #
    if exclusion_condition and exclusion_condition != "":
        # if we received an exclusion condition, apply it here.
        # this is used to exclude rows altogether to save another join with the source
        _all_rows = _all_rows.filter(~F.expr(exclusion_condition))
        df_exclude = _all_rows.filter(F.expr(exclusion_condition))
    else:
        df_exclude = None

    df_update = _all_rows.filter(join_condition)

    # check if there was any change vs existing. take only specified columns or all shared columns if not explicitly specified
    if columns and columns != []:
        shared_cols = list(set(map(str.lower, df_incoming.columns)).intersection(
            map(str.lower, df_existing.columns)).intersection(map(str.lower, columns)))
    else:
        shared_cols = list(set(map(str.lower, df_incoming.columns)).intersection(map(str.lower, df_existing.columns)))

    # fetch the IDs, then join again to get the full record that matched
    original_columns = list(set(map(str.lower, shared_cols+business_keys)))
    df_update_ids = df_update.select(
        [F.col(f"incoming.{colname}") for colname in original_columns]
    ).exceptAll(df_update.select(
        [F.col(f"existing.{colname}") for colname in original_columns]
    ))

    join_condition_ids = functools.reduce(
        operator.and_,
        [
            F.col(f"incoming.`{colname}`") == F.col(f"update_ids.`{colname}`") for colname in business_keys
        ]
    )
    # we join again to get the complete rows of the incoming records that have been updated
    df_update = _all_rows.join(df_update_ids.alias("update_ids"), join_condition_ids, "inner").select("incoming.*")

    return Delta(
        insert=df_insert,
        update=df_update,
        delete=df_delete,
        exclude=df_exclude
    )
