import { IType, Type } from '../type';
import Context from '../../context';
import { SchemaObject } from 'oas/types';

export default abstract class Prop extends Type {
  constructor(
    parent: IType | undefined,
    name: string,
    public schema: SchemaObject
  ) {
    super(parent, name);
  }

  abstract propValue(context: Context): string;
}
