import * as services from "../services";
import * as utils from "../common/utils";
import Logger from "../common/logger";

function parseExtraArgs() {
  // we get an array. and convert to an object where each input is its own name
  const firstIndex = process.argv.findIndex((arg) => arg == "--");
  if (firstIndex == -1) return {};

  return process.argv
    .slice(firstIndex + 1)
    .reduce((map: { [name: string]: string }, obj) => {
      let [key, value] = obj.split("=");
      key = key.replace("--", "");
      map[key] = value;
      return map;
    }, {});
}
async function exec(argv: any) {
  const logger = new Logger();
  const pipelineName = argv.pipeline;
  const distDir = utils.getDistDir();
  // fetch extra arguments
  const args = parseExtraArgs();
  if (argv.runner == "js") {
    // execute locally using js
    await services.executeLocal({
      pipelineName,
      loglevel: argv.loglevel,
      distDir,
      logger,
      args,
    });
  } else {
    await services.deploy({
      distDir,
      host: argv.host,
    });

    await services.execute({
      pipelineName,
      loglevel: argv.loglevel,
      host: argv.host,
      port: argv.port,
      logger,
    });
  }
}

export default exec;
