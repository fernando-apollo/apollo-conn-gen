import Context from '../../context';
import { IType, Type } from '../type';
import { SchemaObject } from 'oas/dist/types';
import Prop from './prop';
import Writer from "../../io/writer";
import {trace} from "../../../log/trace";
import Naming from "../../utils/naming";
import Obj from "../obj";
import Composed from "../comp";

export default class PropObj extends Prop {
  constructor(
    parent: IType,
    name: string,
    public schema: SchemaObject,
    public obj?: IType
  ) {
    super(parent, name, schema);
  }

  visit(_context: Context): void {
    throw new Error('Method not implemented.');
  }
  describe(): string {
    throw new Error('Method not implemented.');
  }

  getValue(context: Context): string {
    console.log('obj', this.obj);
    throw new Error('Method not implemented.');
  }

  select(context: Context, writer: Writer, selection: string[]) {
    trace(context, '-> [prop-obj:select]', 'in ' + this.name + ', obj: ' + this.obj?.name);

    const fieldName = this.name;
    const sanitised = Naming.sanitiseFieldForSelect(fieldName);

    writer
      .append(' '.repeat(context.indent + context.stack.length))
      .append(sanitised);

    if (this.needsBrackets(this.obj!)) {
      writer.append(' {').append('\n');
      context.enter(this);
    }

    for (const child of this.children) {
      child.select(context, writer, selection);
    }

    if (this.needsBrackets(this.obj!)) {
      context.leave(this);
      writer
        .append(' '.repeat(context.indent + context.stack.length))
        .append('}');
      writer.append('\n');
    }

    trace(context, '<- [prop-obj:select]', 'out ' + this.name + ', obj: ' + this.obj?.name);
  }

  private needsBrackets(child: IType): boolean {
    return (
      child instanceof Obj ||
      // TODO: fix this
      // child instanceof Union ||
      child instanceof Composed
    );
  }
}
