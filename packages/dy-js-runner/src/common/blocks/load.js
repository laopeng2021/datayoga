import { DyQuery } from "../../index";
export async function load(runner: any, logger: any, props: any, inputs: any) {
  let insert = new DyQuery(
    "insert",
    `insert into ${props.target} (${props.mapping.map(
      (m) => m.target || m.source
    )})
         select ${props.mapping.map((m) => m.source).join(",")}
        from ${inputs["df"]}`
  ).with(inputs["df"]);
  logger.info(`inserting using load strategy ${props.load_strategy}`);
  logger.debug(insert.toSQL());
  const result = await runner.processor.raw(insert.toSQL());
  logger.debug(result);
  logger.info("done");
}
