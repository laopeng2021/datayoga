export interface IBlock {
  id: string;
  type: string;
  properties: object;
  trace: boolean;
  x: number;
  y: number;
  comment: string;
  outputSchema: Array<any>;
  inputs: { [port: string]: string };
}
