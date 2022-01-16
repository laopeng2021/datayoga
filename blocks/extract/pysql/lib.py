from sqlalchemy import MetaData, Table, select, text, column
from sqlalchemy import text, func, table, create_engine
import os
import pandas as pd
import sqlalchemy as sa
import common.utils
import logging
logger = logging.getLogger("dy_runner")


def extract_table(engine, table_name):
    logger.debug(f"loading {table_name}...")
    metadata = MetaData(bind=None)
    table = Table(
        table_name,
        metadata,
        autoload=True,
        autoload_with=engine
    )
    logger.debug("done")
    return select(table)


def start(runner, properties):
    # create the connection
    connection = common.utils.get_connection(runner.env, properties.get("connection"))
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
    logger.info(f"connecting to ${connection_url}...")
    logger.info("done")
    engine = create_engine(connection_url)

    if properties.get("type") == "database":
        if properties.get("table_name"):
            return extract_table(engine, properties.get("table_name"))
        elif properties.get("query"):
            return text(properties.get("query")).columns(column('*', is_literal=True))
    elif properties.get("type") == "file":
        raw_table_name = extract_flatfile(runner, engine, properties.get("source"), properties.get("filename_columns"))
        return extract_table(engine, raw_table_name)


def load(engine, table_name, file_name):

    # Read CSV with Pandas
    df = pd.read_csv(file_name)
    logger.info(f"loaded {df.shape[0]} rows, {df.shape[1]} columns")
    df["_filename"] = os.path.basename(file_name)

    # Insert to DB
    df.to_sql(table_name,
              con=engine,
              index=False,
              if_exists='replace')


def extract_flatfile(runner, engine, source, filename_column: str = None):

    properties = common.utils.get_source(runner.catalog, source)

    # locate all files
    file_limit = properties.get("limit", 1)
    file_locations = common.utils.get_file_locations(
        common.utils.get_datafolder(runner.env, "raw"),
        properties["filename"],
        limit=file_limit,
        sort=properties.get("sort", 'last_modified'),
        ascending=properties.get("ascending", True)
    )

    # TODO: handle multiple files
    raw_table_name = "_raw_"+source
    logger.info(f"loading {file_locations[0]} into {raw_table_name}")
    load(engine, raw_table_name, file_locations[0])
    return raw_table_name
