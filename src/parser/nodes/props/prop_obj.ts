import Context from '../../context';
import { IType, Type } from '../type';
import { SchemaObject } from 'oas/dist/types';
import Prop from './prop';
import Writer from "../../io/writer";
import {trace} from "../../../log/trace";
import Naming from "../../utils/naming";
import Obj from "../obj";
import Composed from "../comp";
import PropRef from "./prop_ref";

export default class PropObj extends Prop {
  constructor(parent: IType, name: string, public schema: SchemaObject, public obj: IType) {
    super(parent, name, schema);
    this.updateName(parent);
  }

  get id(): string {
    return 'prop:obj:' + this.name;
  }

  visit(context: Context): void {
    if (this.visited) return;
    context.enter(this);
    trace(context, '-> [prop-obj:visit]', 'in ' + this.name + ', obj: ' + this.obj.name);

    this.obj.visit(context);

    if (!this.children.includes(this.obj)) {
      this.add(this.obj);
    }

    this.visited = true;

    trace(context, '<- [prop-obj:visit]', 'out ' + this.name + ', obj: ' + this.obj.name);
    context.leave(this);
  }
  describe(): string {
    throw new Error('Method not implemented.');
  }

  getValue(context: Context): string {
    return Naming.genTypeName(this.name);
  }

  select(context: Context, writer: Writer, selection: string[]) {
    trace(context, '-> [prop-obj:select]', 'in ' + this.name + ', obj: ' + this.obj.name);

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

  private updateName(parent: IType): void {
    if (this.name === 'items') {
      const parentName = parent.name;
      // if the part is a ref, then use replace for the pointed object
      if (parent instanceof PropRef) {
        this.name = parentName.replace('ref:', 'obj:');
      }
      // if within an array, synthesize a name
      else if (parent.constructor.name === 'PropArray') {
        this.name = parentName + 'Item';
      }
      // create a anonymous name
      else {
        this.name = `[prop:obj:anonymous:${this.parent?.name}]`;
      }
    }
  }
}
