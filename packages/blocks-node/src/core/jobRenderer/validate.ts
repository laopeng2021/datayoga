import ValidationError from "@/core/ValidationError";
import { blockTypes, jsonSchemas } from "@/index";
import { Job, Step, Pipeline } from "@datayoga-io/shared";
import * as jsonschema from "jsonschema";
import * as fs from "fs";
import * as path from "path";
/**
 * Validate a Pipeline
 * @summary Run a series of validation rules:
 *           - Structure matches json schema
 *           - All step IDs are unique
 *           - Validation of each block type against its own json schema
 * @param {Pipeline} pipeline - Pipeline to validate
 * @return {boolean} true if valid. if invalid, throws a {ValidationError}
 *
 */
export default function validate(src: object): boolean {
  // load json schemas
  const pipelineJsonSchema = JSON.parse(
    fs.readFileSync(
      require.resolve("@datayoga-io/shared/jsonschema/pipeline.schema.json"),
      "utf8"
    )
  );
  const jobJsonSchema = JSON.parse(
    fs.readFileSync(
      require.resolve("@datayoga-io/shared/jsonschema/job.schema.json"),
      "utf8"
    )
  );
  const stepJsonSchema = JSON.parse(
    fs.readFileSync(
      require.resolve("@datayoga-io/shared/jsonschema/step.schema.json"),
      "utf8"
    )
  );
  const validator = new jsonschema.Validator();
  validator.addSchema(jobJsonSchema, "/job");
  validator.addSchema(stepJsonSchema, "/step");
  // validate job structure against json schema
  const validationResult = validator.validate(src, pipelineJsonSchema);
  if (validationResult.errors.length > 0) {
    let validationError = new ValidationError(
      validationResult.errors.join("\n")
    );
    throw validationError;
  }

  const pipeline = <Pipeline>src;
  // validate each job
  for (let [jobname, job] of Object.entries(pipeline.jobs)) {
    validateJob(job);
  }
  return true;
}

/**
 * Validate a Job
 * @summary Run a series of validation rules:
 *           - Structure matches json schema
 *           - All step IDs are unique
 *           - Validation of each block type against its own json schema
 * @param {Job} job - Job to validate
 * @return {boolean} true if valid. if invalid, throws a {ValidationError}
 *
 */
function validateJob(job: Job) {
  // load the step json schema
  const stepJsonSchema = JSON.parse(
    fs.readFileSync(
      require.resolve("@datayoga-io/shared/jsonschema/step.schema.json"),
      "utf8"
    )
  );

  // validate that all step ids are unique
  const stepIds = job.steps.filter((step) => step.id).map((step) => step.id);
  let duplicateStepIds = stepIds.reduce(function (acc, el, i, arr) {
    if (arr.indexOf(el) !== i && acc.indexOf(el) < 0) acc.push(el);
    return acc;
  }, []);
  if (duplicateStepIds.length > 0) {
    throw new ValidationError(`found duplicate step ids: ${duplicateStepIds}`);
  }

  // validate each step
  for (const step of job.steps) {
    // validate step structure against json schema
    const stepValidationResult = jsonschema.validate(step, stepJsonSchema);
    if (stepValidationResult.errors.length > 0) {
      let validationError = new ValidationError(
        stepValidationResult.errors.join("\n")
      );
      validationError.blockId = step.id;
      throw validationError;
    }

    const blockType = step.uses || step.shell;
    // validate that step type exists
    if (!(blockType in blockTypes)) {
      throw new ValidationError(
        `unknown block type used: ${blockType} at ${step.id}`,
        step.id
      );
    }

    // validate the properties against the schema for each step
    const blockSchema = jsonSchemas[blockType];
    if (blockSchema) {
      const validationResult = jsonschema.validate(
        step.properties || {},
        blockSchema
      );
      if (validationResult.errors.length > 0) {
        let validationError = new ValidationError(
          validationResult.errors.join("\n")
        );
        validationError.blockId = step.id;
        throw validationError;
      }
    }
  }
  // TODO: add validation for broken links
  return true;
}
