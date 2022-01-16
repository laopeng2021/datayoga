import { IBlock } from "./block.interface";
import { ILink } from "./link.interface";

export enum JobType {
  Informatica,
  DataYoga,
}
export interface JobDto {
  /**
   * Description of the job
   */
  name: string;
  description?: string;
  type: JobType;
  /**
   * date created
   */
  created_at?: string;
  /**
   * Date updated
   */
  updated_at?: string;
  /**
   * List of steps. These will be run in order, where each step's output is the next step's input, unless the 'inputs' clause is specified
   */
  graph: {
    blocks: IBlock[];
    links: ILink[];
  };
  variables: any;
}
