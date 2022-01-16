import Block from "@/models/Block";
import { blockTypes } from "@/index";
import { runners } from "@/index";
import { CodeTemplate, SqlTemplate } from "@/core/template";
import * as dagre from "dagre";
import Link from "@/models/Link";
import { Schema } from "@/models/Schema";
import { stripIndent } from "common-tags";
import { spawnSync } from "child_process";
import jobStepsToGraph from "./jobStepsToGraph";
import graphToJobSteps from "./graphToJobSteps";
import validate from "./validate";
import { Step } from "@datayoga-io/shared";

function renderComment(blockNode: Block): string {
  const comment = blockTypes[blockNode["type"]].commentTemplate.render({
    props: blockNode.properties,
    inputs: blockNode.inputs,
    outputs: blockNode.outputs,
    outputSchema: blockNode.outputSchema,
  });
  return comment;
}

function renderBlock({
  blockNode,
  interactive = false,
  runner = "pyspark",
  args = {},
}: {
  blockNode: Block;
  interactive?: boolean;
  runner?: string;
  args?: { [name: string]: string };
}): string {
  const output =
    Object.keys(blockNode.outputs).length == 1
      ? Object.values(blockNode.outputs)[0]
      : null;

  let jobCode = "";
  // check for dryrun mode. in dryrun mode, we load the dummy extract from empty datasets
  if (blockNode["type"] == "extract" && interactive) {
    jobCode = renderExtractFromCache(blockNode);
  } else if (blockNode["type"] == "load" && interactive) {
    jobCode = "# loaded successfully. yeah!";
  } else {
    // if the comment is blank, render a comment automatically
    const comment =
      blockNode.comment && blockNode.comment !== ""
        ? blockNode.comment
        : renderComment(blockNode);

    jobCode += "\n";
    // for SQL and shell, we interpolate
    if (blockNode.type == "sql") {
      const shellTemplate = new SqlTemplate(
        <string>blockNode.properties["run"]
      );
      blockNode.properties["run"] = shellTemplate.render({
        inputs: blockNode.inputs,
        args: args,
      });
    }
    // check if this block has an SQL template
    let sqls: { [output: string]: string } = {};
    if (
      Object.keys(blockTypes[blockNode["type"]].sqlCodeTemplates).length > 0
    ) {
      // this is an SQL block. render all of the outputs
      for (const [output, sqlTemplate] of Object.entries(
        blockTypes[blockNode["type"]].sqlCodeTemplates
      ))
        sqls[output] = sqlTemplate.render({
          comment: comment,
          props: blockNode.properties,
          inputs: blockNode.inputs,
          outputs: blockNode.outputs,
        });
    }
    jobCode += blockTypes[blockNode["type"]].codeTemplates[runner].render({
      comment: comment,
      type: blockNode.type,
      props: blockNode.properties,
      sqls: sqls,
      inputs: blockNode.inputs,
      outputs: blockNode.outputs,
      output: output,
      outputSchema: blockNode.outputSchema,
    });
  }
  if (blockNode.outputSchema.length > 0) {
    // only select a subset of columns
    const columns = blockNode.outputSchema.map(
      (col) =>
        '"' + (col.tablealias ? col.tablealias + "." : "") + col.name + '"'
    );
    jobCode += `\n`;
    jobCode += renderRename(output as string, blockNode.outputSchema, runner);
    jobCode += `\n`;
  }
  if (blockNode.trace) {
    for (const [port, blockOutput] of Object.entries(blockNode.outputs)) {
      jobCode += `\n`;
      jobCode += runners[runner].traceTemplate.render({
        id: blockNode.id,
        df: blockOutput,
        port: port,
      });
      jobCode += `\n`;
    }
  }
  return jobCode;
}

function renderRename(
  output: string,
  outputSchema: Schema,
  runner: string
): string {
  return runners[runner].alterSchemaTemplate.render({
    outputs: { df: output },
    columns: outputSchema,
  });
}

// XXX:todo - move to a template
function renderVariables(variables: any[]) {
  return variables
    .map(
      (variable) =>
        `spark.sql("SET ${variable.name}=${
          variable.type === "string"
            ? `'${variable.value || ""}'`
            : `${variable.value || 0}`
        }")`
    )
    .join("\n");
}

/**
 * Render a graph of blocks and links into a series of jobCommands sorted by topological sort
 *
 * @param {Block[]} blocks - List of blocks
 * @param {Link[]} links - List of links
 * @param {boolean} interactive - Interactive mode is used for UI purposes or validation. It loads empty datasets instead of loading from real sources
 * @return {Block[]} A list of rendered blocks
 *
 */
// TODO: change Interactive to dryRun

function render({
  blocks,
  links,
  runner = "pyspark",
  interactive = false,
  args = {},
}: {
  blocks: Block[];
  links: Link[];
  runner: string;
  interactive: boolean;
  args?: { [name: string]: string };
}): Array<Block> {
  // create a dagre graph for topological sorting
  const graph = new dagre.graphlib.Graph();

  graph.setDefaultEdgeLabel(() => ({}));

  blocks.forEach((block) => {
    graph.setNode(block.id + "", {});
  });

  links.forEach((edge) => {
    graph.setEdge(edge.source, edge.target);
  });

  // create an index of the blocks by id
  const blocksById = blocks.reduce(
    (r: { [id: string]: Block }, v) => ((r[v.id] = v), r),
    {}
  );

  // sort the graph topologically
  const sortedBlockIds = dagre.graphlib.alg.topsort(graph);

  //
  // render the job
  //
  const jobCommands: Array<Block> = [];
  sortedBlockIds.forEach((blockId) => {
    const blockNode = blocksById[blockId];
    // find the block type
    const blockType = blockTypes[blockNode["type"]];

    // find the inputs to this block
    const incomingLinks = links.filter((link) => link.target == blockNode.id);

    // name the inputs
    incomingLinks.forEach((link) => {
      const sourceBlock = blocksById[link.source];
      blockNode.inputs[link.targetPort] = sourceBlock.outputs[link.sourcePort];
    });

    let jobCode = "";
    try {
      // name the outputs
      // XXX todo: handle duplicates
      blockType.outputs.forEach((item) => {
        blockNode.outputs[item.id] = item.outputNameTemplate.render({
          id: blockNode.id,
          props: blockNode.properties,
          inputs: blockNode.inputs,
          outputs: null,
          output: null,
          port: item.id,
        });
      });
      jobCode = renderBlock({ blockNode, runner, interactive, args });
    } catch (e) {
      console.log(e);
      blockNode.error = e.message;
      // XXX: todo: move to template in runner
      jobCode = `# incomplete block of type ${blockNode.type}`;
    }
    blockNode.code = jobCode;
    jobCommands.push(blockNode);
  });
  return jobCommands;
}

/**
 * Render a complete code class with all supporting class wrappers
 *
 * @param {Block[]} blocks - List of blocks
 * @param {Link[]} links - List of links
 * @param {boolean} dryRun - Dryrun mode is used for UI purposes or validation. It loads empty datasets instead of loading from real sources
 * @return {string} A class of transpiled python
 *
 */
// TODO: change Interactive to dryRun

function renderCode(
  blocks: Block[],
  links: Link[],
  runner = "pyspark",
  dryRun = false
): string {
  const commands = render({
    blocks: blocks,
    links: links,
    runner: runner,
    interactive: dryRun,
  });
  return commandsToCode(
    commands.map((command) => command.code),
    runner
  );
}

function commandsToCode(commands: string[], runner: string): string {
  let jobCode = commands.join("\n\n");

  // TODO: change not to be hardcoded and use prettier for JS
  if (runner !== "jssql") {
    try {
      // try to format with autopep8
      const autopep8 = spawnSync("autopep8", ["-"], { input: jobCode });
      if (autopep8.status == null)
        throw new Error(
          `can't run autopep8. May not installed properly: ${autopep8.error?.toString()}`
        );
      else if (autopep8.status > 0)
        throw new Error(
          `autopep8 failed with error code ${
            autopep8.status
          } ${autopep8.stderr.toString()}`
        );

      jobCode = autopep8.stdout.toString();
    } catch (e) {
      // autopep8 not installed. ignore
    }
  }
  return runners[runner].initTemplate.render({
    code: jobCode,
  });
}

function renderExtractFromCache(blockNode: Block): string {
  let jobCode = "";
  if (((blockNode.properties as any).dataset || "") != "") {
    // fetch a dataset for preview
    // prettier-ignore
    jobCode = stripIndent`
      import os
      ${blockNode.outputs["df"]} = spark.read.parquet(os.path.join(env.datamart,"${(blockNode.properties as any).source}","${(blockNode.properties as any).dataset}"))
      ${blockNode.outputs["df"]} = ${blockNode.outputs["df"]}.alias("${
      (blockNode.properties as any).alias
    }")
    `;
  } else {
    // find unique fields. systems may output the same column under multiple names (e.g. informatica converted scripts)
    const uniqueOutputFields: any[] = [];
    for (const item of blockNode.outputSchema) {
      if (
        !uniqueOutputFields.find(
          (el) => el.name == item.name && el.rename == item.rename
        )
      )
        uniqueOutputFields.push(item);
    }
    const structType = [
      ...new Set(blockNode.outputSchema.map((item) => item.name)),
    ]
      .map((column) => `T.StructField("${column}",T.StringType(),True)`)
      .join(",");

    // prettier-ignore
    jobCode = stripIndent`
      ${blockNode.outputs["df"]} = spark.createDataFrame([],T.StructType([${structType}]))
    `;
  }
  return jobCode;
}

export default {
  render,
  renderBlock,
  renderComment,
  renderVariables,
  renderCode,
  jobStepsToGraph,
  graphToJobSteps,
  validate,
};
// used for exposing methods for unit testing
export const testables = {
  commandsToCode,
};
