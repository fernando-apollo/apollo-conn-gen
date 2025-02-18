import Prop from './prop';

import Context from '../../context';
import { trace } from '../../../log/trace';
import PropRef from './prop_ref';
import { IType } from '../type';
import PropObj from './prop_obj';
import { SchemaObject } from 'oas/dist/types';
import Writer from "../../io/writer";
import Naming from "../../utils/naming";

export default class PropArray extends Prop {
  public items?: Prop;

  get id(): string {
    return `prop:array:#${this.name}`;
  }

  public override visit(context: Context): void {
    if (this.visited) return;

    context.enter(this);
    trace(context, '-> [prop-array:visit]', 'in');

    trace(context, '   [prop-array:visit]', 'type: ' + this.items);
    this.items?.visit(context);
    this.visited = true;

    trace(context, '<- [prop:array:visit]', 'out');
    context.leave(this);
  }

  public override getValue(context: Context): string {
    return `[${this.items!.getValue(context)}]`;
  }

  describe(): string {
    return 'PropScalar {name: ' + this.name + '}';
  }

  select(context: Context, writer: Writer, selection: string[]) {
    trace(context, '-> [prop-array:select]', 'in: ' + this.name);

    const fieldName = this.name;
    const sanitised = Naming.sanitiseFieldForSelect(fieldName);
    writer
      .append(' '.repeat(context.indent + context.stack.length))
      .append(sanitised);

    if (this.needsBrackets(this.items!)) {
      writer.append(' {');
      writer.append('\n');
      context.enter(this);
    }

    // Select each child of the items Prop.
    for (const child of this.items!.children) {
      child.select(context, writer, selection);
    }

    if (this.needsBrackets(this.items!)) {
      context.leave(this);
      writer
        .append(' '.repeat(context.indent + context.stack.length))
        .append('}');
    }
    writer.append('\n');

    trace(context, '<- [prop:array:select]', 'out');
  }

  needsBrackets(child: IType): boolean {
    return child instanceof PropRef || child instanceof PropObj;
  }
}
