import Context from '../context';
import { IType, Type } from './type';
import { SchemaObject } from 'oas/types';

export class Scalar extends Type {
  visit(context: Context): void {
    throw new Error('Method not implemented.');
  }
  constructor(parent: IType | undefined,
    name: string,
    public schema: SchemaObject
  ) {
    super(parent, name);
  }

  describe(): string {
    return `Scalar Node - Name: ${this.name}, Value: ${this.schema}`;
  }
}
