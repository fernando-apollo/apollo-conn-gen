import Context from '../context';
import { IType, Type } from './type';
import { SchemaObject } from 'oas/types';
import Factory from "./factory";
import {trace} from "../../log/trace";

export default class Res extends Type {
  public schema: SchemaObject;
  public response?: IType;

  constructor(
    parent: IType,
    name: string,
    schema: SchemaObject,
    response?: IType
  ) {
    super(parent, name);
    this.schema = schema;
    this.response = response;
  }

  get id(): string {
    return 'res:' + this.name;
  }

  visit(context: Context): void {
    if (this.visited) {
      trace(context, '-> [res:visit]', this.name + ' already visited.');
      return;
    }

    context.enter(this);
    trace(context, '-> [get:visit]', 'in ' + this.name);

    this.response = Factory.fromSchema(this, this.schema);
    trace(context, '   [get:visit]', 'array type: ' + this.response.id);
    this.visited = true;

    trace(context, '<- [get:visit]', 'out ' + this.name);
    context.leave(this);
  }

  describe(): string {
    throw new Error('Method not implemented.');
  }
}
