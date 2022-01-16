from sqlalchemy import MetaData, Table, select, text, column
import sqlalchemy as sa
import os
import logging
import common.utils
# import common.db_utils
from typing import List
logger = logging.getLogger("dy_runner")


class LoadStrategy:
    APPEND: str = "append"
    UPSERT: str = "upsert"
    REPLACE: str = "replace"
    UPDATE: str = "update"
    TYPE2: str = "type2"


def get_connection(runner, connection_name):
    connection = common.utils.get_connection(runner.env, connection_name)
    connection_url = sa.engine.URL.create(
        # TODO: fix
        # connection['subtype']+"+"+connection['type'],
        "mssql+pyodbc",
        username=connection.get('user'),
        password=connection.get('password'),
        host=connection.get('host'),
        port=connection.get('port'),
        database=connection.get('database'),
        query={
            "driver": "ODBC Driver 17 for SQL Server",
        },
    )
    logger.debug(f"connecting to ${connection_url}...")
    logger.debug("done")
    engine = sa.create_engine(connection_url)
    return engine.connect()


def start(runner, df, properties):

    conn = get_connection(runner, properties.get("connection"))
    table_name = properties.get("table_name")
    load_strategy = str.lower(properties.get("load_strategy"))
    logger.info(f"loading into {table_name} using load strategy {load_strategy}...")
    metadata = MetaData(bind=None)
    target_table = Table(
        table_name,
        metadata,
        autoload=True,
        autoload_with=runner.engine
    )

    #
    # APPEND
    #
    if load_strategy == LoadStrategy.APPEND:
        # append to table
        shared_columns = [col.name for col in target_table.columns if str.lower(col.name) in
                          {str.lower(col.name) for col in select(df).selected_columns}
                          ]
        result = conn.execute(
            target_table.insert().from_select(shared_columns,
                                              select(*[column(col) for col in shared_columns]).select_from(df))
        )
        logger.info(f"{result.rowcount} rows appended")

    #
    # UPDATE
    #
    elif load_strategy == LoadStrategy.UPDATE:
        df_schema = properties.get("mapping")
        business_keys = list(map(str.lower, properties.get("business_keys")))

        if df_schema and df_schema != {} and df_schema != [] and False:
            columns_to_update = [col.get('target', col.get('source')) for col in df_schema]
        else:
            # update all columns except business keys
            columns_to_update = list(set([str.lower(col.name) for col in df.columns])-set(business_keys))

        # create the SET clause of the update
        set_clause = {
            next(filter(lambda col: str.lower(col.name) == str.lower(update_col), target_table.columns)):
            next(filter(lambda col: str.lower(col.name) == str.lower(update_col), df.columns))
            for update_col in columns_to_update
        }

        # create the join clause for the update statement
        join_clause_segments = []
        for key in business_keys:
            # add a where clause to merge update
            incoming_col = next(filter(lambda col: str.lower(col.name) == str.lower(key), df.columns))
            existing_col = next(filter(lambda col: str.lower(col.name) == str.lower(key), target_table.columns))
            join_clause_segments.append(sa.or_(
                incoming_col == existing_col,
                sa.and_(incoming_col == None, existing_col == None)
            ))
        join_clause = sa.and_(*join_clause_segments)

        # execute
        result = conn.execute(target_table.update().values(set_clause).where(join_clause))
        logger.info(f"{result.rowcount} rows updated")
