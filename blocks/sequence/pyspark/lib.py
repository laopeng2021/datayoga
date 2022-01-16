import pyspark.sql.types as T


def df_zipwithindex(df, offset=1, col_name="rowId"):
    '''
        Enumerates dataframe rows is native order, like rdd.ZipWithIndex(), but on a dataframe 
        and preserves a schema

        :param df: source dataframe
        :param offset: adjustment to zipWithIndex()'s index
        :param colName: name of the index column
    '''

    new_schema = T.StructType(
        [T.StructField(col_name, T.IntegerType(), True)
         ]        # new added field in front
        + df.schema.fields                            # previous schema
    )

    zipped_rdd = df.rdd.zipWithUniqueId()

    new_rdd = zipped_rdd.map(lambda args: ([args[1] + offset] + list(args[0])))

    return new_rdd.toDF(new_schema)


def add_auto_increment(df, column_name: str, sequence_identifier: str):
    # returns: df_new with a new primary key column
    #           for new entries, returns an autoincrement value
    # TODO: get the max_id from the repository or existing max value in table
    max_id = 0
    # max_id:D.Decimal = D.Decimal(get_max_value(df_existing,autoincrement_column,0)+1)

    return df_zipwithindex(df, offset=max_id, col_name=column_name)
