import Context from '../context';
import ArraySchemaObject = OpenAPIV3.ArraySchemaObject;
import {IType, Type} from './type';
import {SchemaObject} from 'oas/dist/types';
import {OpenAPIV3} from "openapi-types";
import Factory from "./factory";
import {trace} from "../../log/trace";
import Writer from '../io/writer';

export default class Arr extends Type {
  public itemsType?: IType;

  constructor(parent: IType | undefined, name: string, public items: ArraySchemaObject) {
    super(parent, name);
    this.itemsType = Factory.fromSchema(this, this.items);
  }

  get id(): string {
    return 'array:' + (this.itemsType ? this.itemsType.name : 'unknown-yet');
  }

  visit(context: Context): void {
    if (this.visited) return;

    context.enter(this);
    trace(context, '-> [array:visit]', 'in');

    this.itemsType?.visit(context);
    this.visited = true;

    trace(context, '-> [array:visit]', 'out');
    context.leave(this);
  }

  describe(): string {
    return `Array {name: ${this.name}}`;
  }

  generate(context: Context, writer: Writer, selection: string[]): void {
    context.enter(this);
    trace(context, '-> [array::generate]', `-> in: ${this.name}`);

    writer.append('[');
    if (this.itemsType) {
      this.itemsType.generate(context, writer, selection);
    }
    writer.append(']');

    trace(context, '<- [array::generate]', `-> out: ${this.name}`);
    context.leave(this);
  }

  select(context: Context, writer: Writer, selection: string[]) {
    trace(context, '-> [array::select]', `-> in: ${this.name}`);

    if (this.itemsType) {
      this.itemsType.select(context, writer, selection);
    }

    trace(context, '<- [array::select]', `-> out: ${this.name}`);
  }
}
