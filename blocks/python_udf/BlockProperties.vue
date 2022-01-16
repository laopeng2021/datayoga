<template lang="pug">
.d-flex.flex-column
  div
    v-autocomplete(:return-object="false",multiple,
      v-model="local.input_columns",small-chips,
      :items="inputSchema.df?inputSchema.df.map( (v) => { return { text: (v.tablealias ? v.tablealias + '.' : '') + v.name }}):[]",
      label="Source Column")
  div
    v-text-field(v-model="local.alias",label="Output column name")
  div.flex-grow-1.d-flex.flex-column
    .function-spec
      | def myudf({{local.parameters.join(",")}}):
    dy-code-editor.flex-grow-1(:code.sync="local.code")
</template>

<script lang="ts">
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import Vue from "vue";
import BlockProperties from "@components/BlockProperties";
import CodeEditor from "@components/CodeEditor.vue";
@Component({
  components: {
    "dy-code-editor": CodeEditor,
  },
})
export default class PythonUDFBlockProperties extends BlockProperties {
  @Prop({ default: (): string[] => [] }) input_columns: string[];
  @Prop(String) alias: string;
  @Prop({
    default:
      "# your awesome code goes here\nend with a return statement\nreturn myval",
  })
  code?: string;
  observer?: ResizeObserver;
  @Prop({ default: (): string[] => [] }) parameters: string[];

  // unobserve before destroy
  beforeDestroy() {
    if (this.observer)
      this.observer.unobserve(this.$refs["monaco-container"] as Element);
  }

  initObserver() {
    // monaco viewer does not know how to catch resize events. we'll help it.
    const observer = new ResizeObserver(() => {
      console.log("resize");
    });
    observer.observe(this.$refs["monaco-container"] as Element);
    this.observer = observer;
  }

  @Watch("local.input_columns", { immediate: true })
  onInputColumnsChanged(newVal: string, oldVal: string) {
    if (this.local.input_columns) {
      console.log(this.local.input_columns);
      this.local.parameters = this.local.input_columns.map(
        (col: string) =>
          "in_" +
          col
            .toLowerCase()
            .split(".")
            .reverse()[0]
            .replace(/[^\w_]/gi, "_")
      );
    }
  }
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
