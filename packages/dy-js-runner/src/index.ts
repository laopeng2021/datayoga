import { knex, Knex } from "knex";
export class DyQuery {
  ctes: DyQuery[] = [];
  query;
  alias;
  constructor(alias: string, query: string) {
    this.query = query;
    this.alias = alias;
  }
  with(query: DyQuery) {
    this.ctes.push(
      ...query.ctes.filter(
        (cte) => !this.ctes.some((currCte) => currCte.alias == cte.alias)
      ),
      new DyQuery(query.alias, query.query)
    );
    return this;
  }
  toSQL() {
    return (
      "WITH " +
      this.ctes.map((cte) => `[${cte.alias}] as (${cte.query})`).join(",") +
      " " +
      this.query
    );
  }
}
export class Runner {
  processor: Knex;
  catalog: Map<string, any>;
  env: any;
  constructor(catalog: Map<string, any>, env: any) {
    this.catalog = catalog;
    this.env = env;
    this.processor = knex({
      client: "mssql",
      connection: {
        host: "127.0.0.1",
        port: 1433,
        user: "sa",
        password: "Wizdi@123",
        database: "wizdi_preprod",
      },
    });
  }
}
