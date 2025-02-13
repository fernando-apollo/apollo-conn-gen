import Context from '../../context';
import { IType, Type } from '../type';
import { SchemaObject } from 'oas/types';
import Prop from './prop';

export default class PropObj extends Prop {
  constructor(
    parent: IType,
    name: string,
    public schema: SchemaObject,
    public obj?: IType
  ) {
    super(parent, name, schema);
  }

  visit(context: Context): void {
    throw new Error('Method not implemented.');
  }
  describe(): string {
    throw new Error('Method not implemented.');
  }

  propValue(context: Context): string {
    console.log('obj', this.obj);
    throw new Error('Method not implemented.');
  }
}
