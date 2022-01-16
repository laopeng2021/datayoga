<template lang="pug">
.d-flex.flex-column
  //-
  //- column mapping selector
  //-
  .d-flex.flex-grow-0
    span Columns
    v-spacer
    v-btn(icon,small,@click="addColumn",v-if="inputSchema.df")
      v-icon add
  .mt-3
    .d-flex.mt-2.px-2.grey.lighten-3(
      v-for="(col,index) in local.columns"
      :key="index"
    )
      v-col
        v-text-field.ml-1.flex-grow-1(
          v-model="col.name"
          label="Column"
          :rules="[rules.required]"
        )
      v-col.d-flex
        dy-code-editor.flex-grow-1(
          :code.sync="col.expression"
        )
      v-col.flex-grow-0
        v-btn(icon, small)
          v-icon(
            small
            color="red"
            @click="removeColumn(index)"
          ) delete
</template>

<script lang="ts">
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import Vue from "vue";
import BlockProperties from "@components/BlockProperties";
import CodeEditor from "@components/CodeEditor.vue";
import rules from "@components/rules";

@Component({
  components: {
    "dy-code-editor": CodeEditor,
  },
})
export default class ExpressionBlockProperties extends BlockProperties {
  @Prop() columns!: [{ column: string; expression: string }];

  rules = rules;

  removeColumn(index: number) {
    this.local.columns.splice(index, 1);
  }

  addColumn() {
    if (!this.local.columns) {
      this.local.columns = [];
    }
    this.local.columns.push({ name: "", expression: "" });
  }
}
</script>

<style scoped>
.function-spec {
  font-family: monospace;
  margin-bottom: 5px;
}
</style>
