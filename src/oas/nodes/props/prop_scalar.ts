import Prop from './prop';

import { SchemaObject } from 'oas/dist/types';
import { trace } from '../../../log/trace';
import { RenderContext } from '../../../prompts/theme';
import Context from '../../context';
import Writer from '../../io/writer';
import Naming from '../../utils/naming';
import Factory from '../factory';
import { IType } from '../type';

export default class PropScalar extends Prop {
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

  public visit(context: Context): void {
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

  public getValue(context: Context): string {
    return this.type;
  }

  public forPrompt(context: Context): string {
    return `${this.name}: ${this.type}`;
  }

  public select(context: Context, writer: Writer, selection: string[]) {
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
