import Context from '../../context';
import Prop from './prop';

import {trace} from '../../../log/trace';
import Factory from '../factory';
import {IType} from '../type';
import {SchemaObject} from 'oas/dist/types';
import Writer from "../../io/writer";
import Naming from "../../utils/naming";
import Arr from "../arr";
import Obj from "../obj";
import Composed from "../comp";
import {RenderContext} from "../../../prompts/theme";
import Union from "../union";
import CircularRef from "../circular_ref";
import _ from "lodash";

export default class PropRef extends Prop {
  refType?: IType;

  constructor(parent: IType | undefined, name: string, public schema: SchemaObject, public ref: string) {
    super(parent, name, schema);
  }

  get id(): string {
    return `prop:ref:#${this.name}`;
  }

  public override add(child: IType): void {
    child.name = this.ref;
    const paths: IType[] = this.ancestors();
    const contains: boolean = paths.map(p => p.id).includes(child.id);

    trace(null, '-> [prop-ref:add]', 'contains child? ' + contains);
    if (contains) {
      const ancestor: IType = paths[paths.map(p => p.id).indexOf(child.id)];
      const wrapper = Factory.fromCircularRef(this, ancestor);
      super.add(wrapper);
      this.visited = true;
      this.refType = wrapper;
    }
    else {
      super.add(child);
    }
  }

  visit(context: Context): void {
    if (this.visited) return;
    context.enter(this);
    trace(context, '-> [prop-ref:visit]', 'in ' + this.name + ', ref: ' + this.ref);

    const schema = context.lookupRef(this.ref);
    if (!schema) {
      throw new Error('Schema not found for ref: ' + this.ref);
    }

    const type = Factory.fromSchema(this, schema);
    if (!this.refType) {
      this.refType = type;
      type.name = this.ref;
      type.visit(context);

      if (!this.children.includes(this.refType!)) {
        this.add(this.refType!);
      }

      this.visited = true;
    }
    trace(context, '<- [prop-ref:visit]', 'out ' + this.name + ', ref: ' + this.ref);
    context.leave(this);
  }

  protected generateValue(context: Context, writer: Writer): void {
    const type = this.refType;

    if (type && (type as IType) instanceof Arr) {
      writer.append('[');
      const items = (type as Arr).itemsType;
      writer.append(_.upperFirst(items!.name));
      writer.append(']');
    }
    else {
      writer.append(this.getValue(context));
    }
  }

  public getValue(_context: Context): string {
    const type = this.refType!;
    const name = type ? type.name : this.ref;
    return Naming.genTypeName(name!);
  }

  forPrompt(context: Context): string {
    return `${this.name}: ${Naming.getRefName(this.ref)} (Ref)`;
  }

  select(context: Context, writer: Writer, selection: string[]) {
    trace(context, '-> [prop-ref:select]', 'in ' + this.name + ', ref: ' + this.ref);
    const fieldName = this.name;
    const sanitised = Naming.sanitiseFieldForSelect(fieldName);
    writer
      .append(' '.repeat(context.indent + context.stack.length))
      .append(sanitised);

    if (this.refType && this.needsBrackets(this.refType)) {
      writer.append(' {').append('\n');
      context.enter(this);
    }

    for (const child of this.children) {
      child.select(context, writer, selection);
    }

    if (this.refType && this.needsBrackets(this.refType)) {
      context.leave(this);
      writer
        .append(' '.repeat(context.indent + context.stack.length))
        .append('}');
    }

    writer.append('\n');
    trace(context, '<- [prop-ref:select]', 'out ' + this.name + ', ref: ' + this.ref);
  }

  private needsBrackets(child: IType): boolean {
    if (child instanceof Arr) {
      return this.needsBrackets(child.itemsType!);
    }
    return (
      child instanceof Obj ||
      child instanceof Union ||
      child instanceof Composed ||
      child instanceof CircularRef
    );
  }
}
