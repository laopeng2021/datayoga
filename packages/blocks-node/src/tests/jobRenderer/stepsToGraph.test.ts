import jobRenderer, { testables } from "@/core/jobRenderer";
import { Block, Link } from "@/models";
import { expect, test } from "@jest/globals";
import { blockTypes } from "@/index";
import ValidationError from "@/core/ValidationError";
import { Step } from "@datayoga-io/shared";

test("series of steps without explicit inputs", () => {
  let steps = [
    new Step({
      id: "a",
      uses: "extract",
    }),
    new Step({
      id: "b",
      uses: "load",
    }),
  ];
  const { blocks, links } = jobRenderer.jobStepsToGraph(steps);
  const expectedLinks = [
    new Link({
      source: "a",
      target: "b",
      sourcePort: "df",
      targetPort: "df",
    }),
  ];
  expect(links).toEqual(expect.arrayContaining(expectedLinks));
});

test("series of steps with explicit inputs - without port", () => {
  let steps = [
    new Step({
      id: "a",
      uses: "extract",
    }),
    new Step({
      id: "b",
      uses: "load",
      inputs: {
        df: "a",
      },
    }),
  ];
  const { blocks, links } = jobRenderer.jobStepsToGraph(steps);
  const expectedLinks = [
    new Link({
      source: "a",
      target: "b",
      sourcePort: "df",
      targetPort: "df",
    }),
  ];
  expect(links).toEqual(expect.arrayContaining(expectedLinks));
});

test("series of steps with explicit inputs - with port", () => {
  let steps = [
    new Step({
      id: "a",
      uses: "extract",
    }),
    new Step({
      id: "b",
      uses: "load",
      inputs: {
        df: "a/df",
      },
    }),
  ];
  const { blocks, links } = jobRenderer.jobStepsToGraph(steps);
  const expectedLinks = [
    new Link({
      source: "a",
      target: "b",
      sourcePort: "df",
      targetPort: "df",
    }),
  ];
  expect(links).toEqual(expect.arrayContaining(expectedLinks));
});

test("series of steps with multiple explicit inputs - without ports", () => {
  let steps = [
    new Step({
      id: "a",
      uses: "extract",
    }),
    new Step({
      id: "b",
      uses: "extract",
    }),
    new Step({
      id: "c",
      uses: "join",
      inputs: {
        df1: "a",
        df2: "b",
      },
    }),
  ];
  const { blocks, links } = jobRenderer.jobStepsToGraph(steps);
  const expectedLinks = [
    new Link({
      source: "a",
      target: "c",
      sourcePort: "df",
      targetPort: "df1",
    }),
    new Link({
      source: "b",
      target: "c",
      sourcePort: "df",
      targetPort: "df2",
    }),
  ];
  expect(links).toEqual(expect.arrayContaining(expectedLinks));
});

test("series of steps with multiple explicit inputs - with ports", () => {
  let steps = [
    new Step({
      id: "a",
      uses: "extract",
    }),
    new Step({
      id: "b",
      uses: "extract",
    }),
    new Step({
      id: "c",
      uses: "join",
      inputs: {
        df1: "a/df",
        df2: "b/df",
      },
    }),
  ];
  const { blocks, links } = jobRenderer.jobStepsToGraph(steps);
  const expectedLinks = [
    new Link({
      source: "a",
      target: "c",
      sourcePort: "df",
      targetPort: "df1",
    }),
    new Link({
      source: "b",
      target: "c",
      sourcePort: "df",
      targetPort: "df2",
    }),
  ];
  expect(links).toEqual(expect.arrayContaining(expectedLinks));
});

test("series of steps with multiple explicit inputs - with and without ports", () => {
  let steps = [
    new Step({
      id: "a",
      uses: "extract",
    }),
    new Step({
      id: "b",
      uses: "extract",
    }),
    new Step({
      id: "c",
      uses: "join",
      inputs: {
        df1: "a",
        df2: "b/df",
      },
    }),
  ];
  const { blocks, links } = jobRenderer.jobStepsToGraph(steps);
  const expectedLinks = [
    new Link({
      source: "a",
      target: "c",
      sourcePort: "df",
      targetPort: "df1",
    }),
    new Link({
      source: "b",
      target: "c",
      sourcePort: "df",
      targetPort: "df2",
    }),
  ];
  expect(links).toEqual(expect.arrayContaining(expectedLinks));
});

test("series of steps with implicit input where source block type has multiple output ports should throw validation error", () => {
  blockTypes["extract"].outputs.push({ id: "id2", uses: "dataframe" });
  let steps = [
    new Step({
      id: "a",
      uses: "extract",
    }),
    new Step({
      id: "b",
      uses: "load",
    }),
  ];

  expect(() => {
    jobRenderer.jobStepsToGraph(steps);
  }).toThrowError(ValidationError);
});

test("series of steps with implicit input where target block type has multiple input ports should throw validation error", () => {
  blockTypes["load"].inputs.push({ id: "id2", uses: "dataframe" });
  let steps = [
    new Step({
      id: "a",
      uses: "extract",
    }),
    new Step({
      id: "b",
      uses: "load",
    }),
  ];

  expect(() => {
    jobRenderer.jobStepsToGraph(steps);
  }).toThrowError(ValidationError);
});

test("series of steps with first block having multiple output port", () => {
  blockTypes["extract"].outputs = [
    { id: "out1", uses: "dataframe" },
    { id: "out2", uses: "dataframe" },
  ];
  let steps = [
    new Step({
      id: "a",
      uses: "extract",
    }),
    new Step({
      id: "b",
      uses: "load",
      inputs: {
        df: "a/out2",
      },
    }),
  ];

  const expectedLinks = [
    new Link({
      source: "a",
      target: "b",
      sourcePort: "out2",
      targetPort: "df",
    }),
  ];
  const { blocks, links } = jobRenderer.jobStepsToGraph(steps);
  expect(links).toEqual(expect.arrayContaining(expectedLinks));
});

test("reference invalid step id in input throws validation error", () => {
  let steps = [
    new Step({
      id: "a",
      uses: "extract",
    }),
    new Step({
      id: "b",
      uses: "load",
      inputs: {
        df: "c/out2",
      },
    }),
  ];

  expect(() => {
    jobRenderer.jobStepsToGraph(steps);
  }).toThrowError(ValidationError);
});

test("reference same step id in input (loop) throws validation error", () => {
  let steps = [
    new Step({
      id: "a",
      uses: "extract",
    }),
    new Step({
      id: "b",
      uses: "load",
      inputs: {
        df: "b/out2",
      },
    }),
  ];

  expect(() => {
    jobRenderer.jobStepsToGraph(steps);
  }).toThrowError(ValidationError);
});

// TODO
// test("creating a loop in the DAG throws a validation error", () => {
// });
