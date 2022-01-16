<template lang="pug">
div
  v-text-field(
    v-model="local.location"
    label="File Name"
  )

  v-select(
    v-model="local.format"
    :items="formats"
    label="File Format"
  )
  
  v-text-field(
    v-model="local.connection"
    label="Connection"
    :rules="[rules.required]"
  )

  v-text-field(
    v-model="local.table_schema"
    label="Schema"
  )

  v-text-field(
    v-model="local.table_name"
    label="Table Name"
    :rules="[rules.required]"
  )
  

  //-
  //- column mapping selector
  //-
  v-row(no-gutters)
    span Columns
    v-spacer
    v-btn(
      v-if="inputSchema.df"
      @click="addColumn"
      icon
      small
    )
      v-icon add
  .mt-3
    v-row(
      v-if="!inputSchema.df"
      no-gutter
      align="center"
      justify="center"
    )
      v-progress-circular(indeterminate,color="primary")

    v-row.mt-2.px-2.grey.lighten-3(
      v-if="inputSchema.df"
      v-for="(col,index) in local.columns"
      :key="index"
      align="center"
      no-gutters
    )
      v-col
        v-combobox(
          v-model="col.name"
          :item-text="item => item.tablealias ? item.tablealias + '.' + item.name : item.name"
          :items="inputSchema.df"
          label="Column"
          :rules="[rules.required]"
        )
      v-col.ml-4
        v-text-field(
          v-model="col.data_type"
          label="Type"
          :rules="[rules.required]"
        )
      v-col.ml-4
        v-checkbox(
          v-model="col.primary_key"
          label="Primary Key"
        )
      v-col.flex-grow-0
        v-btn(icon,small)
          v-icon(
            @click="removeColumn(index)"
            small
            color="red"
          ) delete
</template>

<script lang="ts">
import { Component, Prop, Watch } from "vue-property-decorator";
import BlockProperties from "@components/BlockProperties";
import rules from "@components/rules";

@Component({})
export default class LoadBlockProperties extends BlockProperties {
  @Prop(String) location!: string;
  @Prop({ default: (): any[] => [] }) columns!: any[];
  @Prop({ default: "csv" }) format!: string;
  @Prop(String) connection!: string;
  @Prop(String) table_name!: string;

  rules = rules;

  formats: Array<any> = [
    { text: "Delimited (csv)", value: "csv" },
    { text: "Apache Parquet", value: "parquet" },
    { text: "JSON", value: "json" },
    { text: "Apache Avro", value: "avro" },
  ];

  removeColumn(index: number) {
    this.local.columns.splice(index, 1);
  }

  addColumn() {
    if (!this.local.columns) {
      this.local.columns = [];
    }
    this.local.columns.push({ name: null, rename: null, isDirty: false });
  }

  @Watch("inputSchema", { immediate: true })
  onInputSchemaChanged(newVal: string, oldVal: string) {
    if (
      this.local.columns &&
      this.local.columns.length == 0 &&
      this.inputSchema.df
    ) {
      // set a default value by adding all columns with alias
      this.local.columns = this.inputSchema.df.map((field) => {
        return {
          name: field.tablealias + "." + field.name,
          rename: field.name,
          isDirty: false,
        };
      });
    }
  }
}
</script>
