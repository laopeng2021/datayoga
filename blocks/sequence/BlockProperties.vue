<template lang="pug">
.d-flex.flex-column
  div
    v-text-field(v-model="local.column_name",label="New column name")
</template>

<script lang="ts">
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import Vue from "vue";
import BlockProperties from "@components/BlockProperties";
@Component({
  components: {},
})
export default class ExpressionBlockProperties extends BlockProperties {
  @Prop(String) column_name!: string;
}
</script>
<style scoped>
.function-spec {
  font-family: monospace;
  margin-bottom: 5px;
}
</style>
<style>
.monaco-editor {
  overflow: hidden;
}
</style>
