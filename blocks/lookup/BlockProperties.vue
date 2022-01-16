<template lang="pug">
.d-flex.flex-column
  .flex-grow-0
    v-textarea(
      v-model="local.condition",
      v-on:drop="fieldDropped($event)"
      v-on:dragover="allowDrop"
      rows="5",
      filled,
      label="join condition"
    )
  v-row(no-gutters)
    span Columns
    v-spacer
    v-btn(icon, small, @click="addColumn")
      v-icon add
  .mt-3
    .d-flex.mt-2.px-2.grey.lighten-3(
      v-for="(col,index) in local.columns",
      :key="index"
    )
      v-col
        v-text-field.ml-1.flex-grow-1(
          v-model="local.columns[index]"
          label="Column"
          :rules="[rules.required]"
        )
      v-col.flex-grow-0
        v-btn(icon,small)
          v-icon(small,color="red",@click="removeColumn(index)") delete
</template>

<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import BlockProperties from "@components/BlockProperties";
import SchemaChips from "@components/SchemaChips.vue";
import SchemaPicker from "@components/SchemaPicker.vue";
import rules from "@components/rules";

@Component({
  components: {
    SchemaChips,
    SchemaPicker,
  },
})
export default class JoinBlockProperties extends BlockProperties {
  @Prop(String) condition: string;
  @Prop() columns!: [string];

  rules = rules;

  removeColumn(index: number) {
    this.local.columns.splice(index, 1);
  }

  addColumn() {
    if (!this.local.columns) {
      this.local.columns = [];
    }
    this.local.columns.push("");
  }
}
</script>
