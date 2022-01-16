<template lang="pug">
div
  v-textarea(
    v-on:drop="fieldDropped($event,'condition')"
    v-on:dragover="allowDrop"
    v-model="local.condition"
    rows="5"
    filled
    label="filter expression"
  )
  v-row(no-gutters)
    | Available fields
  SchemaChips(:schema="inputSchema.df")
</template>

<script lang="ts">
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import Vue from "vue";
import BlockProperties from "@components/BlockProperties";
import SchemaChips from "@components/SchemaChips.vue";

@Component({
  components: {
    SchemaChips,
  },
})
export default class FilterBlockProperties extends BlockProperties {
  @Prop({ default: "" }) condition!: string;
}
</script>

<style></style>
