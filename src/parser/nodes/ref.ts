import Context from '../context';
import { IType, Type } from './type';
import { SchemaObject } from 'oas/types';
import { ReferenceObject } from './props/types';
import {trace} from "../../log/trace";
import Factory from "./factory";

export default class Ref extends Type {
  private refType: IType;

  constructor(
    parent: IType | undefined,
    name: string,
    public schema: ReferenceObject | null
  ) {
    super(parent, name);
  }

  get id(): string {
    return 'ref:' + this.schema.$ref;
  }

  describe(): string {
    return `Ref{name: ${this.name}}`;
  }

  visit(context: Context): void {
    // console.log('schema', this.schema);
    if (this.visited) return;
    const ref = this.schema.$ref;

    context.enter(this);
    trace(context, '-> [ref:visit]', 'in: ' + this.schema.$ref);

    const schema: SchemaObject | null = context.lookupRef(ref);
    if (!schema) {
      throw new Error('Schema not found for ref: ' + ref);
    }

    this.refType = Factory.fromSchema(this, schema);
    // Set the name of the resolved type to the reference string.
    this.refType.name = ref;
    this.refType.visit(context);

    this.visited = true;
    trace(context, '<- [ref:visit]', 'out: ' + ref);
    context.leave(this);
  }
}
