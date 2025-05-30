import { OasContext } from '../oasContext.js';
import { Arr, Prop, Composed, Factory, IType, Obj, Union } from './internal.js';
import _ from 'lodash';
import { SchemaObject } from 'oas/types';
import { trace } from '../log/trace.js';
import { Writer } from '../io/writer.js';
import { Naming } from '../utils/naming.js';

/**
 * @deprecated No longer used
 */
export class PropRef extends Prop {
  get id(): string {
    return `prop:ref:#${this.name}`;
  }
  public refType?: IType;

  constructor(
    parent: IType | undefined,
    name: string,
    public schema: SchemaObject,
    public ref: string,
  ) {
    super(parent, name, schema);
  }

  /*  public override add(child: IType): IType {
    child.name = this.ref;
    const paths: IType[] = this.ancestors();
    const contains: boolean = paths.map((p) => p.id).includes(child.id);

    trace(null, '-> [prop-ref:add]', 'contains child? ' + contains);
    let added: IType = child;
    if (contains) {
      const ancestor: IType = paths[paths.map((p) => p.id).indexOf(child.id)];
      const wrapper = Factory.fromCircularRef(this, ancestor);
      added = super.add(wrapper);
      this.visited = true;
      this.refType = wrapper;
    } else {
      added = super.add(child);
    }

    return added;
  }*/

  public visit(context: OasContext): void {
    if (this.visited) {
      return;
    }
    context.enter(this);
    trace(context, '-> [prop-ref:visit]', 'in ' + this.name + ', ref: ' + this.ref);

    const schema = context.lookupRef(this.ref);
    if (!schema) {
      throw new Error('Schema not found for ref: ' + this.ref);
    }

    const type = Factory.fromSchema(context, this, schema);
    if (!this.refType) {
      this.add(type);
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

  public getValue(_context: OasContext): string {
    const type = this.refType!;
    const name = type ? type.name : this.ref;

    return Naming.genTypeName(name!) + this.nameSuffix();
  }

  public forPrompt(context: OasContext): string {
    return `[prop] ${this.name}: ${Naming.getRefName(this.ref)} (Ref)`;
  }

  public select(context: OasContext, writer: Writer, selection: string[]) {
    trace(context, '-> [prop-ref:select]', 'in ' + this.name + ', ref: ' + this.ref);
    const fieldName = this.name;
    const sanitised = Naming.sanitiseFieldForSelect(fieldName);
    writer.write(' '.repeat(context.indent + context.stack.length)).write(sanitised);

    if (this.refType && this.needsBrackets(this.refType)) {
      writer.write(' {').write('\n');
      context.enter(this);
    }

    for (const child of this.children) {
      child.select(context, writer, selection);
    }

    if (this.refType && this.needsBrackets(this.refType)) {
      context.leave(this);
      writer.write(' '.repeat(context.indent + context.stack.length)).write('}');
    }

    writer.write('\n');
    trace(context, '<- [prop-ref:select]', 'out ' + this.name + ', ref: ' + this.ref);
  }

  generateValue(context: OasContext, writer: Writer): void {
    const type = this.refType;

    if (type && (type as IType) instanceof Arr) {
      writer.write('[');
      const items = (type as Arr).itemsType;
      writer.write(_.upperFirst(items!.name));
      writer.write(']');
    } else {
      writer.write(this.getValue(context));
    }
  }

  private needsBrackets(child: IType): boolean {
    if (child instanceof Arr) {
      return this.needsBrackets(child.itemsType!);
    }
    return child instanceof Obj || child instanceof Union || child instanceof Composed;
  }
}
