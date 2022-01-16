import { getDyFolderRoot } from "../common/utils";
import { expect, test } from "@jest/globals";
import path from "path";
test("get dy root folder when exists", () => {
  // test by specifying the scaffold folder
  const rootFolder = getDyFolderRoot(
    path.resolve(path.join(__dirname, "../../scaffold/src/jobs"))
  );
  expect(rootFolder).toEqual(
    path.resolve(path.join(__dirname, "../../scaffold"))
  );
});

test("get dy root folder when doesn't exist", () => {
  // test by specifying the scaffold folder
  expect(() => {
    const rootFolder = getDyFolderRoot(
      path.resolve(path.join(__dirname, "../../"))
    );
  }).toThrow();
});
