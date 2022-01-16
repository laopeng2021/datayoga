//
// read the lib templates and concatenate into one big utils py that can be imported
// aggregates the imports separate of the
//
import * as glob from "fast-glob";
import * as fs from "fs";
import * as os from "os";
import * as fse from "fs-extra";
import archiver from "archiver";
import path from "path";
const { sep } = require("path");
const ASSETS_DIR = path.join("assets");
// Get the temporary directory of the system
const tmpDir = os.tmpdir();

const buildPy = async (runner: string) => {
  const TMP_ASSETS_DIR = fs.mkdtempSync(`${tmpDir}${sep}`);
  const COMMON_DIR = path.join(TMP_ASSETS_DIR, "common");
  console.log("compiling python lib for blocks");
  const files = glob.sync(`../../blocks/**/${runner}/lib.py`);
  console.log(`blocks: ${files.join("\n")}`);

  // create target folder
  const blocksTargetFolder = path.join(COMMON_DIR, "blocks");

  if (!fs.existsSync(blocksTargetFolder)) {
    fs.mkdirSync(blocksTargetFolder, { recursive: true });
  }
  // create __init__.py file
  fs.closeSync(fs.openSync(path.join(blocksTargetFolder, "__init__.py"), "w"));
  fse.copySync(path.join("build-py", "common"), COMMON_DIR);
  for (const file of files) {
    const filePath = path.dirname(<string>file).split(path.sep);
    // copy all the lib.py files
    fs.copyFileSync(
      <string>file,
      path.join(blocksTargetFolder, filePath[filePath.length - 2] + ".py")
    );
  }

  const output = fs.createWriteStream(
    path.join(ASSETS_DIR, `${runner}_dy_lib.zip`)
  );
  const archive = archiver("zip");

  archive.pipe(output);

  // append files from a sub-directory, putting its contents at the root of archive
  // archive.directory(source_dir, false);

  // append files from a sub-directory and naming it `new-subdir` within the archive
  archive.directory(COMMON_DIR, "common");
  await archive.finalize();

  fs.rmdirSync(COMMON_DIR, { recursive: true });
};

const buildJs = async (runner: string) => {
  const TMP_ASSETS_DIR = fs.mkdtempSync(`${tmpDir}${sep}`);
  const COMMON_DIR = path.join(TMP_ASSETS_DIR, "common");
  console.log("compiling javascript lib for blocks");
  const files = glob.sync(`../../blocks/**/${runner}/lib.ts`);
  console.log(`blocks: ${files.join("\n")}`);

  // create target folder
  const blocksTargetFolder = path.join(COMMON_DIR, "blocks");

  if (!fs.existsSync(blocksTargetFolder)) {
    fs.mkdirSync(blocksTargetFolder, { recursive: true });
  }
  // create index.ts file
  const indexFile = fs.openSync(path.join(blocksTargetFolder, "index.ts"), "w");

  for (const file of files) {
    const filePath = path.dirname(<string>file).split(path.sep);
    const blockName = filePath[filePath.length - 2];
    // add to index.ts
    fs.writeSync(
      indexFile,
      `export {${blockName}} from "./${blockName}"` + "\n"
    );
    // copy all the lib.ts files
    fs.copyFileSync(
      <string>file,
      path.join(blocksTargetFolder, blockName + ".ts")
    );
  }
  fs.closeSync(indexFile);
  // copy to js-runner
  fse.copySync(TMP_ASSETS_DIR, "../dy-js-runner/src/");
};

buildPy("pyspark");
buildPy("pysql");
buildJs("jssql");
