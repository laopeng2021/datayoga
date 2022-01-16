export interface SchemaField {
  name: string;
  tablealias: string;
  dataType: string;
  selected: boolean;
  rename?: string;
  id?: string;
}
export interface Schema extends Array<SchemaField> {}
