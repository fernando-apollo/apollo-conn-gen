import Prop from './prop';

import Context from '../../context';
import { IType } from '../type';
import { SchemaObject } from 'oas/types';
import Factory from "../factory";

export default class PropScalar extends Prop {
  private propType?: IType;

  constructor(parent: IType, name: string, public type: string, public schema: SchemaObject) {
    super(parent, name, schema);
  }

  get id(): string {
    return `prop:scalar:${this.name}`;
  }

  public visit(context: Context): void {
    if (this.visited) return;

    context.enter(this);
    if (!this.propType) {
      this.propType = Factory.fromSchema(this, this.schema);
      // this.propType.visit(context);
      this.visited = true;
    }
    context.leave(this);
  }

  propValue(context: Context): string {
    throw new Error('Method not implemented.');
  }

  describe(): string {
    return 'PropScalar {name: ' + this.name + '}';
  }
}
