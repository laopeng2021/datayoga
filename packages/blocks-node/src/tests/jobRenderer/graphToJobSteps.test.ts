import jobRenderer, { testables } from "@/core/jobRenderer";
import { Block, Link } from "@/models";
import { expect, test } from "@jest/globals";
import { blockTypes } from "@/index";
import ValidationError from "@/core/ValidationError";
import { Step } from "@datayoga-io/shared";

test("series of blocks with default inputs", () => {
  let blocks = [
    new Block({
      id: "a",
      type: "extract",
    }),
    new Block({
      id: "b",
      type: "load",
    }),
  ];
  let links = [
    new Link({
      source: "a",
      target: "b",
      sourcePort: "df",
      targetPort: "df",
    }),
  ];
  const expectedSteps = [
    new Step({
      id: "a",
      uses: "extract",
      properties: {},
    }),
    new Step({
      id: "b",
      uses: "load",
      properties: {},
    }),
  ];
  const steps = jobRenderer.graphToJobSteps({ blocks, links });
  expect(steps).toEqual(expect.arrayContaining(expectedSteps));
});

test("series of blocks with multiple outputs explicit inputs", () => {
  let blocks = [
    new Block({
      id: "a",
      type: "extract",
    }),
    new Block({
      id: "a2",
      type: "extract",
    }),
    new Block({
      id: "b",
      type: "find_delta",
    }),
    new Block({
      id: "c",
      type: "load",
    }),
  ];
  let links = [
    new Link({
      source: "a",
      target: "b",
      sourcePort: "df",
      targetPort: "incoming",
    }),
    new Link({
      source: "a2",
      target: "b",
      sourcePort: "df",
      targetPort: "existing",
    }),
    new Link({
      source: "b",
      target: "c",
      sourcePort: "insert",
      targetPort: "df",
    }),
  ];
  const expectedSteps = [
    new Step({
      id: "a",
      uses: "extract",
      properties: {},
    }),
    new Step({
      id: "b",
      uses: "find_delta",
      inputs: {
        incoming: "a/df",
        existing: "a2/df",
      },
      properties: {},
    }),
    new Step({
      id: "c",
      uses: "load",
      properties: {},
      inputs: {
        df: "b/insert",
      },
    }),
  ];
  const steps = jobRenderer.graphToJobSteps({ blocks, links });
  expect(steps).toEqual(expect.arrayContaining(expectedSteps));
});

test("series of blocks with single output explicit inputs", () => {
  let blocks = [
    new Block({
      id: "a",
      type: "extract",
    }),
    new Block({
      id: "a2",
      type: "extract",
    }),
    new Block({
      id: "b",
      type: "join",
    }),
    new Block({
      id: "c",
      type: "load",
    }),
  ];
  let links = [
    new Link({
      source: "a",
      target: "b",
      sourcePort: "df",
      targetPort: "left",
    }),
    new Link({
      source: "a2",
      target: "b",
      sourcePort: "df",
      targetPort: "right",
    }),
    new Link({
      source: "b",
      target: "c",
      sourcePort: "df",
      targetPort: "df",
    }),
  ];
  const expectedSteps = [
    new Step({
      id: "a",
      uses: "extract",
      properties: {},
    }),
    new Step({
      id: "b",
      uses: "join",
      inputs: {
        left: "a/df",
        right: "a2/df",
      },
      properties: {},
    }),
    new Step({
      id: "c",
      uses: "load",
      properties: {},
    }),
  ];
  const steps = jobRenderer.graphToJobSteps({ blocks, links });
  expect(steps).toEqual(expect.arrayContaining(expectedSteps));
});
