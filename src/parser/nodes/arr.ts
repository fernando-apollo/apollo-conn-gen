import Context from '../context';
import ArraySchemaObject = OpenAPIV3.ArraySchemaObject;
import {IType, Type} from './type';
import {SchemaObject} from 'oas/types';
import {OpenAPIV3} from "openapi-types";
import Factory from "./factory";
import {trace} from "../../log/trace";

export default class Arr extends Type {
  public itemsType?: IType;

  constructor(parent: IType | undefined, name: string, public items: ArraySchemaObject) {
    super(parent, name);
    this.itemsType = Factory.fromSchema(this, this.items);
  }

  get id(): string {
    return 'array:' + (this.itemsType ? this.itemsType.name : 'unknown-yet');
  }

  visit(context: Context): void {
    if (this.visited) return;

    context.enter(this);
    trace(context, '-> [array:visit]', 'in');

    this.itemsType.visit(context);
    this.visited = true;

    trace(context, '-> [array:visit]', 'out');
    context.leave(this);
  }

  describe(): string {
    throw new Error('Method not implemented.');
  }
}
