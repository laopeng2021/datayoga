import { IBlock } from "@datayoga-io/shared";
export enum BlockState {
  NotStarted = "not_started",
  Stopped = "stopped",
  Running = "running",
  Completed = "completed",
}

export default class Block implements IBlock {
  id: string;
  type: string;
  properties: { [name: string]: string | number | boolean };
  status: BlockState;
  trace: boolean;
  code: string;
  x: number;
  y: number;
  comment: string;
  outputs: any;
  outputSchema: Array<any>;
  inputs: { [port: string]: string };
  outputLinks: any;
  inputLinks: any;
  error: string;

  constructor({
    id,
    type,
    inputs = {},
    properties = {},
    x = 0,
    y = 0,
    comment = "",
    outputSchema = [],
    trace = false,
  }: {
    id: string;
    type: string;
    inputs?: { [port: string]: string };
    properties?: { [name: string]: string | number | boolean };
    x?: number;
    y?: number;
    comment?: string;
    outputSchema?: Array<any>;
    trace?: boolean;
  }) {
    this.id = id;
    this.type = type;
    this.properties = properties;
    this.x = x;
    this.y = y;
    this.comment = comment;
    this.inputs = inputs;
    this.outputs = {};
    this.outputSchema = outputSchema;
    this.outputs = {};
    this.code = "";
    this.trace = trace;
  }
  static toJson(block: Block) {
    return {
      id: block.id,
      type: block.type,
      properties: block.properties,
      x: block.x,
      y: block.y,
      comment: block.comment,
    };
  }
}
