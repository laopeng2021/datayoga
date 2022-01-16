/**
 * a step executes a block of a certain type
 */
export class Step {
  /**
   * optional identifier. can be used to reference from another step
   */
  id?: string;
  /**
   * type of block to run
   */
  uses!: string;
  /**
   * shell to use for running the command
   */
  shell?: string;
  /**
   * command to run
   */
  run?: string;
  /**
   * An explanation about the purpose of this instance.
   */
  properties?: any;
  /**
   * optionally map an input of this block from a named reference of another block's port. use the format of <id>/<output_port>
   */
  output_schema?: Array<any>;
  trace?: boolean;

  inputs?: {
    [k: string]: string;
  };
  constructor(attr: any) {
    Object.assign(this, attr);
  }
}
