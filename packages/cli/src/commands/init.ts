import fs from "fs";
import fse from "fs-extra";
import path from "path";
import Logger from "../common/logger";
import tree from "tree-node-cli";

async function init(argv: any) {
  const logger = new Logger();
  const project = argv.project;

  if (fs.existsSync(project)) throw new Error(`${project} already exists`);

  logger.info(`Scaffoldoing: ${project}`);
  fse.copySync(path.join(__dirname, "..", "..", "scaffold"), project);
  logger.info(
    tree(project, {
      allFiles: true,
    })
  );
}

export default init;
