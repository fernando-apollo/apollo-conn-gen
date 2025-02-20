import Context from "../context";
import {IType, Type} from "./type";
import {SchemaObject} from 'oas/dist/types';;
import {trace} from "../../log/trace";
import Writer from "../io/writer";
import GqlUtils from "../utils/gql";
import {RenderContext} from "../../prompts/theme";
import Naming from "../utils/naming";

export default class En extends Type {
  constructor(parent: IType, public schema: SchemaObject, public items: string[] = []) {
    super(parent, 'enum');
  }

  get id(): string {
    return 'enum:' + this.name;
  }

  visit(context: Context): void {
    if (this.visited) return;

    context.enter(this);
    trace(context, '-> [enum:visit]', 'in: ' + this.items.toString());

    if (!context.inContextOf("Param", this)) {
      context.store(this.name, this);
    }

    this.visited = true;

    trace(context, '<- [enum:visit]', 'out: ' + this.items.toString());
    context.leave(this);
  }

  forPrompt(_context: Context): string {
    return `${Naming.getRefName(this.name)} (Enum): ${this.items.join(', ')}`;
  }

  generate(context: Context, writer: Writer, selection: string[]): void {
    context.enter(this);
    trace(context, '-> [enum::generate]', `-> in: ${this.name}`);

    if (!context.inContextOf("Param", this)) {
      const builder =
        'enum ' + Naming.getRefName(this.name) + ' {\n' +
        this.items.map((s) => ' ' + s).join(',\n') +
        '\n}\n\n';
      writer.write(builder);
    }
    // this covers the case where a union combines a scalar with an enum.
    else if (!context.inContextOf("Union", this)) {
      writer.write(GqlUtils.getGQLScalarType(this.schema));
    }

    // Otherwise, do nothing.
    trace(context, '<- [enum::generate]', `-> out: ${this.name}`);
    context.leave(this);
  }

  select(context: Context, writer: Writer, selection: string[]) {
    trace(context, '-> [enum::select]', `-> in: ${this.name}`);

    // do nothing?
    /*const dependencies = this.dependencies(context);
    dependencies.forEach((dependency) => {
      dependency.select(context, writer);
    });*/

    trace(context, '<- [enum::select]', `-> out: ${this.name}`);
  }
}