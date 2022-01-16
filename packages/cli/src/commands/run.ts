import * as services from "../services";
import * as utils from "../common/utils";
import Logger from "../common/logger";

async function run(argv: any) {
  const logger = new Logger();
  const { moduleName, pipelineName } = utils.getPipelineProps(argv.job);
  const distDir = utils.getDistDir();

  // build the catalog
  await services.buildCatalog(logger, distDir);

  // build the job
  await services.build(moduleName, pipelineName, distDir, argv.runner);

  await services.deploy({
    distDir,
    host: argv.host,
  });

  await services.execute({
    pipelineName: argv.job,
    loglevel: argv.loglevel,
    host: argv.host,
    port: argv.port,
    logger,
  });
}

export default run;
