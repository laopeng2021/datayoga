import pyspark.sql
import pyspark.sql.functions as F
from typing import List, Dict


def lookup(
        df: pyspark.sql.DataFrame,
        lookup_df: pyspark.sql.DataFrame,
        columns: List[Dict[str, str]],
        lookup_condition: str,
        how: str = "left_outer") -> pyspark.sql.DataFrame:
    # join with the main dataframe
    # TODO: handle more than one match
    df_out = df.alias("main").join(
        lookup_df.alias("lookup"),
        F.expr(lookup_condition),
        "left_outer" if how == "" else how)
    df_out = df_out.select(
        "main.*", *[F.col(f"lookup.{col.get('name')}").alias(col.get("rename", col.get("name"))) for col in columns])
    return df_out
