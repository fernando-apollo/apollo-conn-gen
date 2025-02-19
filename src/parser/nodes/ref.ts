import Context from '../context';
import { IType, Type } from './type';
import { SchemaObject } from 'oas/dist/types';
import { ReferenceObject } from './props/types';
import {trace} from "../../log/trace";
import Factory from "./factory";
import Naming from "../utils/naming";
import Writer from "../io/writer";
import Arr from "./arr";
import {RenderContext} from "../../prompts/theme";

export default class Ref extends Type {
  public refType?: IType;

  constructor(
    parent: IType | undefined,
    name: string,
    public schema: ReferenceObject | null
  ) {
    super(parent, name);
  }

  get id(): string {
    return 'ref:' + this.schema?.$ref;
  }

  forPrompt(context: Context): string {
    return `${Naming.getRefName(this.name)} (Ref)`;
  }

  visit(context: Context): void {
    // console.log('schema', this.schema);
    if (this.visited) return;
    const ref = this.schema?.$ref ?? '';

    context.enter(this);
    trace(context, '-> [ref:visit]', 'in: ' + ref);

    const schema: SchemaObject | null = context.lookupRef(ref);
    if (!schema) {
      throw new Error('Schema not found for ref: ' + ref);
    }

    this.refType = Factory.fromSchema(this, schema);
    // Set the name of the resolved type to the reference string.
    this.refType.name = ref;
    this.refType.visit(context);

    this.visited = true;
    trace(context, '<- [ref:visit]', 'out: ' + ref);
    context.leave(this);
  }

  public generate(context: Context, writer: Writer, selection: string[]): void {
    context.enter(this);
    trace(context, '-> [ref::generate]', `-> in: ${this.name}`);

    // If we're in a Response context and the resolved type is an Arr,
    // generate it with array notation.
    if (context.inContextOf("Response", this) && this.refType instanceof Arr) {
      writer.append('[').append(this.children[0].name).append(']');
    }
    else {
      // Rewrite terrible names to something more sensible.
      const sanitised = Naming.genTypeName(this.name);
      const refName = Naming.getRefName(this.name);
      writer.write(sanitised === refName ? refName : sanitised);
    }

    trace(context, '<- [ref::generate]', `-> out: ${this.name}`);
    context.leave(this);
  }

  select(context: Context, writer: Writer, selection: string[]) {
    trace(context, '-> [ref::select]', `-> in: ${this.name}`);
    if (this.refType) {
      this.refType.select(context, writer, selection);
    }
    trace(context, '<- [ref::select]', `-> out: ${this.name}`);
  }
}
