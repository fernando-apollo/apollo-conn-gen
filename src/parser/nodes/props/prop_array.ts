import Prop from './prop';

import Context from '../../context';
import { trace } from '../../../log/trace';
import PropRef from './prop_ref';
import { IType } from '../type';
import PropObj from './prop_obj';
import { SchemaObject } from 'oas/types';

export default class PropArray extends Prop {
  public items?: Prop;

  get id(): string {
    return `prop:array:#${this.name}`;
  }

  public override visit(context: Context): void {
    if (this.visited) return;

    context.enter(this);
    trace(context, '-> [prop-array:visit]', 'in');

    trace(context, '   [prop-array:visit]', 'type: ' + this.items);
    this.items?.visit(context);
    this.visited = true;

    trace(context, '<- [prop:array:visit]', 'out');
    context.leave(this);
  }

  propValue(context: Context): string {
    return `[${this.items?.propValue(context)}]`;
  }

  describe(): string {
    return 'PropScalar {name: ' + this.name + '}';
  }

  needsBrackets(child: IType): boolean {
    return child instanceof PropRef || child instanceof PropObj;
  }
}
