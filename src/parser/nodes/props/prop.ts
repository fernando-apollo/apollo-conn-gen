import { SchemaObject } from 'oas/dist/types';
import { trace } from '../../../log/trace';
import Context from '../../context';
import Writer from '../../io/writer';
import Naming from '../../utils/naming';
import { IType, Type } from '../type';

export default abstract class Prop extends Type {
  public required: boolean = false;

  constructor(
    parent: IType | undefined,
    name: string,
    public schema: SchemaObject,
  ) {
    super(parent, name);
  }

  public generate(context: Context, writer: Writer, selection: string[]): void {
    const description = this.schema.description;
    if (description != null) {
      if (description.includes('\n') || description.includes('\r') || description.includes('"')) {
        writer.append('  """\n').append('  ').append(description).append('\n  """\n');
      } else {
        writer.append('  "').append(description).append('"\n');
      }
    }

    writer.append('  ').append(Naming.sanitiseField(this.name)).append(': ');

    this.generateValue(context, writer);

    if (this.required) {
      writer.append('!');
    }

    // TODO: source
    // writer.append(" # ").append(this.parent);

    writer.append('\n');
  }

  public abstract getValue(context: Context): string;

  protected generateValue(context: Context, writer: Writer): void {
    writer.append(this.getValue(context));
  }
}
