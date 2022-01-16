import * as Handlebars from "handlebars";
import ValidationError from "@/core/ValidationError";
import Block from "@/models/Block";
import Link from "@/models/Link";
import { blockTypes } from "@/index";
import { stripIndent } from "common-tags";
import { Step } from "@datayoga-io/shared";

/**
 * Given an array of blocks, generates a DAG and returns blocks and links array
 *
 * @param {Block[]} blocks - List of blocks
 * @return { blocks: Block[]; links: Link[] } List of blocks and list of links
 *
 */
export default function jobStepsToGraph(
  steps: Step[]
): { blocks: Block[]; links: Link[] } {
  const blocks: Block[] = [];
  const links: Link[] = [];
  let lastBlock: Block | null = null;

  // loop through the steps
  for (const step of steps) {
    // create a new empty block
    const block = new Block({
      id: step.id!,
      type: step.uses || step.shell,
      outputSchema: step.output_schema,
      trace: step.trace || false,
    });
    Object.assign(block.properties, step.properties);
    if (step.shell) {
      block.properties["run"] = step.run;
    }
    blocks.push(block);

    //
    // handle linking
    //
    const blockDescriptor = blockTypes[block.type];
    if (!blockDescriptor)
      throw new Error(
        `can't find block descriptor for block type ${block.type}`
      );

    // if this block type has no inputs, skip linking
    // unless it is a shell. Shell commands may have references in handlebars. extract those
    if (blockDescriptor.inputs.length > 0 || step.shell) {
      // check if explicitly linked
      let inputs: { [name: string]: string } = {};
      if (step.shell) {
        // we get an array. and convert to an object where each input is its own name
        inputs = extractInputsFromTemplate(step.run).reduce(
          (map: { [name: string]: string }, obj) => {
            map[obj] = obj;
            return map;
          },
          {}
        );
      } else {
        inputs = step.inputs;
      }
      if (inputs && Object.keys(inputs).length > 0) {
        for (const [targetPort, source] of Object.entries(inputs)) {
          // check if the target explicitly mentions the port. If not, we lookup the descriptor
          let sourceId = source;
          let sourcePort: string = null;
          if (source.indexOf("/") > -1) {
            sourceId = source.split("/")[0];
            sourcePort = source.split("/")[1];
          }
          // validate we are not refering the same step creating an infinite loop
          if (sourceId == step.id) {
            throw new ValidationError(
              `input is referencing itself creating a loop at port ${targetPort}`,
              step.id
            );
          }

          // validate that the source exists
          const sourceStep = steps.find((step) => step.id == sourceId);
          if (!sourceStep) {
            throw new ValidationError(
              `source ${sourceId} not found for port ${targetPort}`,
              step.id
            );
          }

          if (!sourcePort) {
            // implicit source port. take the port name from the descriptor. if more than one, throw a validation error
            const sourceBlockDescriptor =
              blockTypes[sourceStep.uses || sourceStep.shell];
            if (sourceBlockDescriptor.outputs.length == 1) {
              sourcePort = sourceBlockDescriptor.outputs[0].id;
            } else {
              // validation error. we have more than one input so can't implicitly link
              throw new ValidationError(
                stripIndent`port needs to be explicitly specified when source has more than 1 output port
                          source: ${sourceId}
              `,
                step.id
              );
            }
          }
          links.push(
            new Link({
              source: sourceId,
              sourcePort: sourcePort,
              target: step.id,
              targetPort: targetPort,
            })
          );
        }
      } else {
        //
        // implicit link
        //

        // verify we are the first block in the file
        if (lastBlock) {
          // pull the descriptor and check if there is only one output and one input
          const lastBlockDescriptor = blockTypes[lastBlock.type];
          // validate if this block type has multiple inputs. connect accordingly.
          if (
            blockDescriptor.inputs.length == 1 &&
            lastBlockDescriptor.outputs.length == 1
          ) {
            links.push(
              new Link({
                source: lastBlock.id,
                target: step.id!,
                sourcePort: lastBlockDescriptor.outputs[0].id,
                targetPort: blockDescriptor.inputs[0].id,
              })
            );
          } else {
            // validation error. we have more than one input so can't implicitly link
            throw new ValidationError(
              stripIndent`cannot implicitly link two steps where source or target have more than one port.
                source id ${lastBlock.id} has ${lastBlockDescriptor.outputs.length} output ports and
                target id ${block.id} has ${blockDescriptor.inputs.length} input ports
                `,
              block.id
            );
          }
        }
      }
    }
    // TODO verify that we don't need an input an have a port that is empty. Add required to descriptor schema
    lastBlock = block;
  }
  return {
    blocks,
    links,
  };
}

/**
 * Extract references to steps and mark them as inputs within a handlebars template
 *
 * @param {string} template - List of blocks
 * @return string[] A list of inputs
 *
 */
var Visitor = Handlebars.Visitor;

class ImportScanner extends Visitor {
  steps: Set<string> = new Set();

  MustacheStatement(stmt: any) {
    if (stmt.path.original == "step") {
      this.steps.add(stmt.params[0].value);
    }
    Visitor.prototype.MustacheStatement.call(this, stmt);
  }
}

function extractInputsFromTemplate(template: string): string[] {
  // we use handlebars AST to traverse and parse the string
  var ast = Handlebars.parse(template);
  const scanner = new ImportScanner();
  scanner.accept(ast);
  return [...scanner.steps];
}

// used for exposing methods for unit testing
export const testables = {
  extractInputsFromTemplate,
};
