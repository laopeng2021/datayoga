import lib
import pyspark.sql.functions as F
import pyspark.sql.types as T
from pyspark.sql import SparkSession
import pytest


@pytest.fixture(scope="session")
def spark(request):
    """Fixture for creating a spark context."""
    spark = SparkSession \
        .builder \
        .appName("SuperGlue") \
        .getOrCreate()
    request.addfinalizer(lambda: spark.stop())

    return spark


def test_find_delta_updates(spark):

    df_existing = spark.range(1, 4)
    df_existing = df_existing.withColumn("col1", F.lit("a"))
    df_incoming = spark.range(2, 5)
    df_incoming = df_incoming.withColumn("col1", F.lit("b"))
    delta = lib.find_delta(
        df_existing,
        df_incoming,
        business_keys=["id"],
        include_deletes=True
    )
    # test update
    df_update_expected = spark.createDataFrame([
        (2, "b"),
        (3, "b")
    ], ["id", "col1"])

    assert delta.update.collect() == df_update_expected.collect()

    # test insert
    df_insert_expected = spark.createDataFrame([
        (4, "b")
    ], ["id", "col1"])

    assert delta.insert.collect() == df_insert_expected.collect()

    # test delete
    df_delete_expected = spark.createDataFrame([
        (1, "a")
    ], ["id", "col1"])

    assert delta.delete.collect() == df_delete_expected.collect()


def test_multiple_business_keys(spark_context):
    pass


def test_find_delta_no_updates(spark_context):
    pass


def test_find_delta_with_non_shared_columns(spark_context):
    pass
