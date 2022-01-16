/* tslint:disable */
import { Job } from "./job";
/**
 * representation of an ETL or ELT pipeline
 */
export interface Pipeline {
  /**
   * unique identifier for this job
   */
  id: string;
  /**
   * Description of the job
   */
  description?: string;
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
  jobs: {
    [job_name: string]: Job;
  };
  [k: string]: unknown;
}
