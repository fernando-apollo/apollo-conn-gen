import { SchemaObject } from 'oas/dist/types';
import { trace } from '../../log/trace';
import { RenderContext } from '../../prompts/theme';
import Context from '../context';
import Writer from '../io/writer';
import Factory from './factory';
import { IType, Type } from './type';

export default class Response extends Type {
  public schema: SchemaObject;
  public response?: IType;

  constructor(parent: IType, name: string, schema: SchemaObject, response?: IType) {
    super(parent, name);
    this.schema = schema;
    this.response = response;
  }

  get id(): string {
    return 'res:' + this.name;
  }

  public visit(context: Context): void {
    if (this.visited) {
      trace(context, '-> [res:visit]', this.name + ' already visited.');
      return;
    }

    context.enter(this);
    trace(context, '-> [get:visit]', 'in ' + this.name);

    this.response = Factory.fromSchema(this, this.schema);
    trace(context, '   [get:visit]', 'array type: ' + this.response.id);
    this.visited = true;

    trace(context, '<- [get:visit]', 'out ' + this.name);
    context.leave(this);
  }

  public forPrompt(context: Context): string {
    return 'Response';
  }

  public generate(context: Context, writer: Writer, selection: string[]): void {
    context.enter(this);
    trace(context, '-> [response:generate]', `-> in: ${this.parent!.name}`);

    if (this.response) {
      this.response.generate(context, writer, selection);
    }

    trace(context, '<- [response:generate]', `-> out: ${this.parent!.name}`);
    context.leave(this);
  }

  public select(context: Context, writer: Writer, selection: string[]): void {
    trace(context, '-> [response:select]', `-> in: ${this.parent!.name}`);

    if (this.response) {
      this.response.select(context, writer, selection);
    }

    trace(context, '<- [response:select]', `-> out: ${this.parent!.name}`);
  }
}
