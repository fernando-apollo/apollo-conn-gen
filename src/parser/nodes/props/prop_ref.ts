import Context from '../../context';
import Prop from './prop';

import {trace} from '../../../log/trace';
import Factory from '../factory';
import {IType} from '../type';
import {SchemaObject} from 'oas/types';

export default class PropRef extends Prop {
  private refType?: IType;

  constructor(parent: IType | undefined, name: string, public schema: SchemaObject, public ref: string) {
    super(parent, name, schema);
  }

  get id(): string {
    return `prop:ref:#${this.name}`;
  }

  visit(context: Context): void {
    if (this.visited) return;
    context.enter(this);
    trace(
      context,
      '-> [prop-ref:visit]',
      'in ' + this.name + ', ref: ' + this.ref
    );

    const schema = context.lookupRef(this.ref);
    if (!schema) {
      throw new Error('Schema not found for ref: ' + this.ref);
    }

    const type = Factory.fromSchema(this, this.schema);
    if (!this.refType) {
      this.refType = type;
      type.name = this.ref;
      // type.visit(context);
      this.visited = true;
    }

    trace(context, '<- [prop-ref:visit]', 'out ' + this.name + ', ref: ' + this.ref);
    context.leave(this);
  }

  propValue(context: Context): string {
    throw new Error('Method not implemented.');
  }

  describe(): string {
    throw new Error('Method not implemented.');
  }
}
