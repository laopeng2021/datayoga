import ValidationError from "@/core/ValidationError";
import Block from "@/models/Block";
import Link from "@/models/Link";
import { blockTypes } from "@/index";
import { Step } from "@datayoga-io/shared";
import * as dagre from "dagre";

/**
 * Given a blocks and links array, returns an array of Blocks
 *
 * @param { blocks: Block[]; links: Link[] } List of blocks and list of links
 * @return {Block[]} blocks - List of blocks
 *
 */
export default function graphToJobSteps({
  blocks,
  links,
}: {
  blocks: Block[];
  links: Link[];
}): Step[] {
  // sort the blocks by topological sort order. this will minimize the cases where we need to explicitly state the 'inputs' clause
  const graph = new dagre.graphlib.Graph({ multigraph: true });

  graph.setDefaultEdgeLabel(() => ({}));

  blocks.forEach((block) => {
    graph.setNode(block.id, {});
  });

  links.forEach((edge) => {
    graph.setEdge(
      edge.source,
      edge.target,
      "",
      edge.sourcePort + ":" + edge.targetPort
    );
  });

  // create an index of the blocks by id
  const blocksById = blocks.reduce(
    (r: { [id: string]: Block }, v) => ((r[v.id] = v), r),
    {}
  );

  // sort the graph topologically
  const sortedBlockIds = dagre.graphlib.alg.topsort(graph);
  const steps: Step[] = [];
  let previousBlock = null;

  for (let currBlockId of sortedBlockIds) {
    // create the block itself
    let currBlock = blocksById[currBlockId];
    let step = new Step({});
    step.id = currBlockId;
    step.uses = currBlock.type;
    step.properties = currBlock.properties;

    if (previousBlock) {
      // this is not the first block. check the inputs/outputs to add to clause
      // if (previousBlock.outputs)
      const inputs: {
        [k: string]: string;
      } = {};
      const inEdges = graph.inEdges(currBlockId);
      // check if we can assume the previous blocks implicitly links to this one. this makes the yaml easier to read
      if (
        !(
          blockTypes[currBlock.type].inputs.length == 1 &&
          previousBlock &&
          blockTypes[previousBlock.type].outputs.length == 1 &&
          inEdges[0].v == previousBlock.id
        )
      ) {
        for (const edge of inEdges) {
          inputs[edge.name.split(":")[1]] =
            edge.v + "/" + edge.name.split(":")[0];
        }
        step.inputs = inputs;
      }
    }
    steps.push(step);
    previousBlock = currBlock;
  }
  return steps;
}
