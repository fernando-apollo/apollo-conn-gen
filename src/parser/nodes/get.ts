import {
  ResponseObject,
  SchemaObject,
  MediaTypeObject,
} from 'oas/types';
import {Operation} from "oas/operation";

import Context from '../context';
import {IType, Type} from './type';
import {trace, warn} from '../../log/trace';
import {ReferenceObject} from './props/types';
import Factory from './factory';
import Naming from "../utils/naming";

export default class Get extends Type {
  private resultType?: IType;

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

    // 2. Visit responses
    this.visitResponses(context);
    this.visited = true;

    trace(context, '<- [get:visit]', 'out ' + this.name);
    context.leave(this);
  }

  describe(): string {
    return `Get{name: ${this.name}}`;
  }

  public getGqlOpName(): string {
    return Naming.genOperationName(this.operation.path, this.operation);
  }

  private visitResponses = (context: Context) => {
    if (!this.operation.getResponseStatusCodes().includes('200')) {
      throw new Error('Could not find a valid 200 response');
    }

    const response = this.operation.schema.responses['200'];
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
      const json = response.content['application/json'];
      if (!json) {
        warn(context, `  [${code}]`, 'no entry found for content application/json!');
      } else {
        this.visitResponseContent(context, code, json);
      }
    } else {
      throw new Error('Not yet implemented for: ' + JSON.stringify(response));
    }
  }

  private visitResponseContent(context: Context, code: string, media: MediaTypeObject): void {
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
}
