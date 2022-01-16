<template lang="pug">
v-row(no-gutters).flex-column
  .d-flex.flex-grow-0
    v-combobox(
      v-model="local.groupBy",
      small-chips,
      deletable-chips,
      multiple,
      :item-text="item => (item.tablealias? item.tablealias +'.' : '')+ item.name"
      :items="inputSchema.df",
      label="Columns to group by"
    )
  .d-flex.flex-grow-0
    span Aggregations
    v-spacer
    v-btn(icon,small,@click="addAggregationColumn")
      v-icon add
  div.mt-3
    v-row.mt-2.px-2.grey.lighten-3(
      align="center",
      no-gutters,
      v-for="(agg,index) in local.aggregations",
      :key="index"
    )
      v-col
        v-select(v-model="agg.name",small-chips,
          :item-text="item => item.tablealias +'.'+ item.name"
          :items="inputSchema.df",
          label="Column")
      v-col
        v-select.ml-1.flex-grow-1(
          v-model="agg.expression",
          label="Aggregation",
          :items="Object.entries(aggregationFunctions)",
          :item-value="item => item[0]",
          :item-text="item => item[1].title"
        )
      v-col
        v-text-field.ml-1.flex-grow-1(v-model="agg.alias",label="Alias")
      v-col.flex-grow-0
        v-btn(icon,small)
          v-icon(small,color="red",@click="removeAggregationColumn(index)") delete
  //- v-textarea(
  //-   v-model="local.aggregate",
  //-   rows="5",
  //-   filled,
  //-   label="aggregate"
  //- )
  v-text-field.mt-3(v-model="local.alias",label="Output Dataframe Alias")

</template>

<script lang="ts" src="./BlockProperties.ts"></script>

<style></style>
