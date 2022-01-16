import { stripIndent } from "common-tags";
import jobRenderer, { testables } from "@/core/jobRenderer";
import { expect, test } from "@jest/globals";
import ValidationError from "@/core/ValidationError";
import { Step, Job } from "@datayoga-io/shared";
import * as yaml from "js-yaml";
import { blockTypes, jsonSchemas } from "@/index";

const dummySchema = {
  $schema: "http://json-schema.org/draft-07/schema",
  type: "object",
  required: ["dummy_prop"],
  properties: {
    dummy_prop: {
      type: "string",
    },
  },
};
jsonSchemas["dummy"] = dummySchema;
blockTypes["dummy"] = blockTypes["extract"]; //TODO: create a proper fixture with a descriptor

test("step ids should be unique", () => {
  const job: Job = <Job>yaml.load(stripIndent`
    id: schools
    description: load schools
    jobs:
      load_schools:
        steps:
          - id: extract_csv
            type: dummy
            properties:
              dummy_prop: val
          - id: extract_csv
            type: dummy
            properties:
              dummy_prop: val
    `);
  expect(() => {
    jobRenderer.validate(job);
  }).toThrowError(ValidationError);
});

test("steps with correct json schema should not throw error", () => {
  const job: Job = <Job>yaml.load(stripIndent`
    id: schools
    description: load schools
    jobs:
      load_schools:
        steps:
          - id: extract_csv
            uses: dummy
            properties:
              dummy_prop: val
    `);
  const validationResult: boolean = jobRenderer.validate(job);
  expect(validationResult).toEqual(true);
});

test("steps with incorrect json schema should throw error", () => {
  const job: Job = <Job>yaml.load(stripIndent`
    id: schools
    description: load schools
    jobs:
      load_schools:
        steps:
          - id: extract_csv
            type: dummy
    `);
  expect(() => {
    jobRenderer.validate(job);
  }).toThrowError(ValidationError);
});

test("step with unknown block type should throw error", () => {
  const job: Job = <Job>yaml.load(stripIndent`
    id: schools
    description: load schools
    jobs:
      load_schools:
        steps:
          - id: extract_csv
            type: unknown
    `);
  expect(() => {
    jobRenderer.validate(job);
  }).toThrowError(ValidationError);
});

test("step with unknown properties should throw error", () => {
  const job: Job = <Job>yaml.load(stripIndent`
    id: schools
    description: load schools
    jobs:
      load_schools:
        steps:
        - id: extract_csv
          type: dummy
          properties:
            dummy_prop: val
          invalid_prop:
            name: bla
    `);
  expect(() => {
    jobRenderer.validate(job);
  }).toThrowError(ValidationError);
});

test("job must have steps property", () => {
  const job: Job = <Job>yaml.load(stripIndent`
    id: schools
    description: load schools
    jobs:
      load_schools:
  `);
  expect(() => {
    jobRenderer.validate(job);
  }).toThrowError(ValidationError);
});
