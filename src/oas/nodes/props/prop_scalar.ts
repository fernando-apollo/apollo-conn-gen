import { Prop } from './prop';
import { SchemaObject } from 'oas/dist/types';
import { trace } from '../../log/trace';
import { OasContext } from '../../oasContext';
import { Writer } from '../../io/writer';
import { Naming } from '../../utils/naming';
import { Factory } from '../factory';
import { IType } from '../type';

export class PropScalar extends Prop {
  private propType?: IType;

  constructor(
    parent: IType,
    name: string,
    public type: string,
    public schema: SchemaObject,
  ) {
    super(parent, name, schema);
  }

  get id(): string {
    return `prop:scalar:${this.name}`;
  }

  public visit(context: OasContext): void {
    if (this.visited) {
      return;
    }

    context.enter(this);
    if (!this.propType) {
      this.propType = Factory.fromSchema(this, this.schema);
      // this.propType.visit(context);
      this.visited = true;
    }
    context.leave(this);
  }

  public getValue(context: OasContext): string {
    return this.type;
  }

  public forPrompt(context: OasContext): string {
    return `${this.name}: ${this.type}`;
  }

  public select(context: OasContext, writer: Writer, selection: string[]) {
    trace(context, '   [prop:select]', this.name);
    const sanitised = Naming.sanitiseFieldForSelect(this.name);
    writer
      .append(' '.repeat(context.indent + context.stack.length))
      .append(sanitised)
      .append('\n');

    for (const child of this.children) {
      child.select(context, writer, selection);
    }
  }
}
