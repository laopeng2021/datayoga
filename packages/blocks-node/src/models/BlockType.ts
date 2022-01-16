import { CodeTemplate } from "../core/template";

export default class BlockType {
  title: string; // used for display in menus
  type: string; // unique id
  stencil: string; // stencil (category) id
  description: string; // used for display in menus
  color: string; // used for display in menus
  icon: string; // name of material icon
  inputs: Array<any>;
  _outputs: Array<any>;
  codeTemplates: { [runner: string]: CodeTemplate } = {};
  sqlCodeTemplates: { [output: string]: CodeTemplate } = {};
  commentTemplate: CodeTemplate;
  comment_template: string; // default comment to use in block

  public constructor(init?: Partial<BlockType>) {
    if (init) this.setProperties(init);
  }
  public setProperties(init?: Partial<BlockType>) {
    Object.assign(this, init);
    this.commentTemplate = new CodeTemplate(
      this.comment_template ? this.comment_template : this.type
    );
  }
  set outputs(newOutputs: Array<any>) {
    this._outputs = newOutputs;
    this._outputs.forEach((output, index) => {
      // see if we have a custom name
      if (output.name_template) {
        this._outputs[index].outputNameTemplate = new CodeTemplate(
          output.name_template
        );
      } else {
        this._outputs[index].outputNameTemplate = new CodeTemplate(
          "df_{{id}}_{{port}}"
        );
      }
    });
  }
  get outputs(): Array<any> {
    return this._outputs;
  }
}
