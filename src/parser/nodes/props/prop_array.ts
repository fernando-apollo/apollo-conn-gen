import Prop from './prop';

import Context from '../../context';
import {trace} from '../../../log/trace';
import PropRef from './prop_ref';
import {IType} from '../type';
import PropObj from './prop_obj';
import Writer from "../../io/writer";
import Naming from "../../utils/naming";
import Factory from "../factory";
import PropScalar from "./prop_scalar";
import {RenderContext} from "../../../prompts/theme";

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

  public setItems(items: Prop): void {
    this.items = items;
    if (!this.children.includes(items)) {
      this.add(items);
    }
  }

  public override getValue(context: Context): string {
    return `[${this.items!.getValue(context)}]`;
  }

  public add(child: IType): void {
    const paths: IType[] = this.ancestors();
    const contains: boolean = paths.map(p => p.id).includes(child.id);

    trace(null, '-> [prop-array:add]', 'contains child? ' + contains);

    if (contains) {
      const ancestor: IType = paths[paths.map(p => p.id).indexOf(child.id)];
      const wrapper: IType = Factory.fromCircularRef(this, ancestor);
      super.add(wrapper);
      this.visited = true;
    } else {
      super.add(child);
    }
  }

  forPrompt(context: Context): string {
    return `${this.name}: [${this.items!.getValue(context)}]`;
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
