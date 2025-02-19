import {
  ResponseObject,
  SchemaObject,
  MediaTypeObject,
  ParameterObject
} from 'oas/dist/types';
import {Operation} from "oas/dist/operation";

import Context from '../context';
import {IType, Type} from './type';
import {trace, warn} from '../../log/trace';
import {ReferenceObject} from './props/types';
import Factory from './factory';
import Naming from "../utils/naming";
import Writer from '../io/writer';
import Param from "./param/param";
import {RenderContext} from "../../prompts/theme";

export default class Get extends Type {
  public resultType?: IType;
  public params: Param[] = [];

  constructor(name: string, public operation: Operation) {
    super(undefined, name);
  }

  get id(): string {
    return `get:${this.name}`;
  }

  visit(context: Context): void {
    if (this.visited) {
      trace(context, '-> [get:visit]', this.name + ' already visited.');
      return;
    }

    context.enter(this);
    trace(context, '-> [get:visit]', 'in ' + this.name);

    // 1. Visit params.
    this.visitParameters(context);

    // 2. Visit responses
    this.visitResponses(context);
    this.visited = true;

    trace(context, '<- [get:visit]', 'out ' + this.name);
    context.leave(this);
  }

  forPrompt(context: Context): string {
    return `[GET] ${this.name}`;
  }

  generate(context: Context, writer: Writer, selection: string[]): void {
    context.enter(this);
    trace(context, '-> [get::generate]', `-> in: ${this.name}`);

    const summary = this.operation.getSummary();
    const originalPath = this.operation.path;

    if (summary || originalPath) {
      writer.append('  """\n').append('  ');
      if (summary) {
        writer.append(summary).append(' ');
      }
      if (originalPath) {
        writer.append('(').append(originalPath).append(')');
      }
      writer.append('\n  """\n');
    }

    writer.append('  ').append(this.getGqlOpName());
    this.generateParameters(context, writer, selection);

    if (this.resultType) {
      writer.append(': ');
      this.resultType.generate(context, writer, selection);
    }

    writer.append('\n');
    trace(context, '<- [get::generate]', `-> out: ${this.name}`);
    context.leave(this);
  }

  select(_context: Context, _writer: Writer, _selection: string[]) {
    // do nothing
  }

  public getGqlOpName(): string {
    return Naming.genOperationName(this.operation.path, this.operation);
  }

  private visitParameters(context: Context): void {
    trace(context, '-> [get::params]', 'in: ' + this.name);

    const parameters = this.operation.getParameters();

    if (parameters && parameters.length > 0) {
      this.params = parameters
        .filter((p) => !p.in || (p.in && (p.in as string).toLowerCase() !== 'header'))
        .map((p: ParameterObject) => this.visitParameter(context, this, p));
    }
    else {
      this.params = [];
    }

    trace(context, '<- [get::params]', 'out: ' + this.name);
  }

  private visitResponses = (context: Context) => {
    if (!this.operation.getResponseStatusCodes().includes('200')) {
      throw new Error('Could not find a valid 200 response');
    }

    const response = this.operation.schema.responses!['200'];
    if (!response) {
      throw new Error('Could not find a 200 response');
    }

    this.visitResponse(context, '200', response as ResponseObject);
  };

  private visitResponse(context: Context, code: string, response: ResponseObject): void {
    const content = response.content as MediaTypeObject;

    if ('$ref' in response) {
      this.visitResponseRef(context, response as ReferenceObject);
    }
    // If the response has a content property, we need to find the JSON content.
    else if (content) {
      const json = response.content!['application/json']!;
      if (!json) {
        warn(context, `  [${code}]`, 'no entry found for content application/json!');
      } else {
        this.visitResponseContent(context, code, json);
      }
    } else {
      throw new Error('Not yet implemented for: ' + JSON.stringify(response));
    }
  }

  private visitResponseContent(context: Context, _code: string, media: MediaTypeObject): void {
    trace(context, '-> [get::responses::content]', 'in ' + this.name);
    const schema = media!.schema as SchemaObject;

    if (!schema) {
      throw new Error('No schema content found!');
    }

    this.resultType = Factory.fromResponse(context, this, schema);
    // PENDING: do not visit anymore
    // if (this.resultType) {
    //   this.resultType.visit(context);
    // }

    if (this.resultType && !this.children.includes(this.resultType)) {
      this.add(this.resultType);
    }

    trace(context, '<- [get::responses::content]', 'out ' + this.name);
  }

  private visitResponseRef(context: Context, ref: ReferenceObject): void {
    trace(context, '-> [get::responses::ref]', `in: ${this.name}, ref: ${ref.$ref}`);

    const lookup = context.lookupResponse(ref.$ref!);
    if (!lookup) {
      throw new Error('Could not find a response with ref: ' + ref.$ref);
    }

    if ('$ref' in lookup) {
      throw new Error('Not yet implemented for nested refs');
    }

    this.visitResponse(context, ref.$ref!, lookup as ResponseObject);
    trace(context, '<- [get::responses::ref]', `out: ${this.name}, ref: ${ref.$ref}`);
  }

  private generateParameters(context: Context, writer: Writer, selection: string[]): void {
    const sorted = this.params
      .sort((a, b) => (b.required ? 1 : 0) - (a.required ? 1 : 0));

    if (sorted.length === 0) return;

    writer.append('(');

    sorted.forEach((parameter, index) => {
      if (index > 0) writer.append(', ');
      parameter.generate(context, writer, selection);
    });

    writer.append(')');
  }

  private visitParameter(context: Context, parent: Type, p: ParameterObject): Param {
    trace(context, '->[visitParameter]', 'begin: ' + p.name);

    const param = Factory.fromParam(context, parent, p);
    param.visit(context);

    trace(context, '<-[visitParameter]', 'end: ' + p.name);
    return param;
  }
}
