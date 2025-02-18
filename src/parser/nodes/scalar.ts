import Context from '../context';
import Writer from '../io/writer';
import {IType, Type} from './type';
import {SchemaObject} from 'oas/dist/types';
import {trace} from "../../log/trace";

export class Scalar extends Type {
  visit(_context: Context): void {
    this.visited = true;
  }
  constructor(parent: IType | undefined, name: string, public schema: SchemaObject) {
    super(parent, name);
  }

  describe(): string {
    return `Scalar Node - Name: ${this.name}, Value: ${this.schema}`;
  }

  generate(context: Context, writer: Writer, selection: string[]): void {
    context.enter(this);
    trace(context, '-> [scalar::generate]', `-> in: ${this.name}`);
    writer.write(this.name);
    trace(context, '<- [scalar::generate]', `-> out: ${this.name}`);
    context.leave(this);
  }

  select(context: Context, writer: Writer, selection: string[]) {
      // Scalars do not need to be selected.
    }
}
