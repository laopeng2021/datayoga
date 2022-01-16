import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import Vue from "vue";
import BlockProperties from "@components/BlockProperties";
import SchemaChips from "@components/SchemaChips.vue";
import aggregationFunctions from "./aggregationFunctions";

@Component({
  components: { SchemaChips },
})
export default class AggregateBlockProperties extends BlockProperties {
  // standard data dictionary for supported functions and mapping to pyspark
  aggregationFunctions = aggregationFunctions;
  @Prop({ default: (): string[] => [] }) groupBy: string[];
  @Prop() alias!: string;
  @Prop({ default: (): any[] => [{ col: null, agg: null, alias: null }] })
  aggregations: any[];

  removeAggregationColumn(index: number) {
    this.local.aggregations.splice(index, 1);
  }
  addAggregationColumn() {
    if (!this.local.aggregations) {
      this.local.aggregations = [];
    }
    this.local.aggregations.push({ col: null, agg: null, alias: null });
  }
}
