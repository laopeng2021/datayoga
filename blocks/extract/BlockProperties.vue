<template lang="pug">
div
  v-radio-group(
    label="Type:"
    row
    v-model="local.type"
  )
    v-radio(label="File", value="file")
    v-radio(label="Database", value="database")


  template(v-if="local.type === 'database'")
    v-text-field(v-model="local.connection",label="Connection")

    v-radio-group(
      row
      v-model="sourceType"
    )
      v-radio(label="Query", value="query")
      v-radio(label="Specific Table", value="table")

    v-text-field(
      v-model="local.table_schema"
      label="Schema"
    )

    template(v-if="sourceType === 'query'")
      v-textarea(
        rows="5"
        filled
        label="Query"
        v-model="local.query"
        :rules="[rules.required]"
      )
      .d-flex.flex-grow-0
        span Columns
        v-spacer
        v-btn(icon,small,@click="addColumn",v-if="inputSchema.df")
          v-icon add
      .mt-3
        .d-flex.mt-2.px-2.grey.lighten-3(
          v-for="(col, index) in local.columns"
          :key="index"
        )
          v-col
            v-text-field.ml-1.flex-grow-1(
              v-model="local.columns[index]"
              label="Column"
              :rules="[rules.required]"
            )
          v-col.flex-grow-0
            v-btn(icon, small)
              v-icon(
                small
                color="red"
                @click="removeColumn(index)"
              ) delete

    template(v-else)
      v-text-field(
        v-model="local.table_name"
        label="Table Name"
        :rules="[rules.required]"
      )

  v-combobox(
    v-model="local.source"
    :items="sources"
    label="Source name"
  )
  v-combobox(
    v-model="local.dataset"
    :items="datasets"
    label="Dataset to use for preview"
  )
  v-text-field(v-model="local.alias",label="Alias")
</template>

<script lang="ts">
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import BlockProperties from "@components/BlockProperties";
import rules from "@components/rules";

@Component({})
export default class ExtractBlockProperties extends BlockProperties {
  @Prop(String) type!: string;
  @Prop(String) connection!: string;
  @Prop(String) table_name!: string;
  @Prop(String) table_schema!: string;
  @Prop(String) query!: string;
  @Prop() columns!: [string];

  @Prop(String) source!: string;
  @Prop(String) dataset!: string;
  @Prop(String) alias!: string;

  rules = rules;
  sources: Array<any> = [];
  datasets: Array<any> = [];
  catalog: any = {};
  sourceType = "";

  async created() {
    this.sourceType = this.query ? "query" : "table";
    this.sources = [
      "demo",
      "signals",
      "revenuewize",
      "aisles",
      "departments",
      "order_products",
      "orders",
      "products",
    ];
    this.catalog = {
      demo: ["superstore"],
      signals: ["signals.parquet"],
      revenuewize: "clean_data_03_2021",
      aisles: ["aisles"],
      departments: ["departments"],
      order_products: ["order_products_1M"],
      orders: ["orders"],
      products: ["products"],
    };
  }

  @Watch("local.source", { immediate: true })
  onSourceChanged(newVal: string, oldVal: string) {
    this.datasets = this.catalog[newVal];
    if (!this.local.alias) {
      this.local.alias = newVal;
    }
  }

  removeColumn(index: number) {
    this.local.columns.splice(index, 1);
  }

  addColumn() {
    if (!this.local.columns) {
      this.local.columns = [];
    }
    this.local.columns.push({ column: "", expression: "" });
  }
}
</script>

<style></style>
