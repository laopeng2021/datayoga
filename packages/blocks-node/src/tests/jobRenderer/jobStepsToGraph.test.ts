import { testables } from "@/core/jobRenderer/jobStepsToGraph";
import { Block, Link } from "@/models";
import { expect, test } from "@jest/globals";
import { blockTypes } from "@/index";
import ValidationError from "@/core/ValidationError";
import { Step } from "@datayoga-io/shared";

test("find inputs in sql text", () => {
  const template = `
  select a from {{step 'first'}}
  and {{step 'second'}}
  `;
  const inputs = testables.extractInputsFromTemplate(template);
  expect(inputs).toEqual(["first", "second"]);
});
test("find inputs in sql text with other handlebars expressions", () => {
  const template = `
  select a from {{step 'first'}} {{var 'hello'}} {{a}}
  and {{step 'second'}}
  `;
  const inputs = testables.extractInputsFromTemplate(template);
  expect(inputs).toEqual(["first", "second"]);
});
test("find inputs in sql text without duplications", () => {
  const template = `
  select a from {{step 'first'}} {{var 'hello'}} {{a}}
  and {{step 'second'}} and {{step 'first'}}
  `;
  const inputs = testables.extractInputsFromTemplate(template);
  expect(inputs).toEqual(["first", "second"]);
});
