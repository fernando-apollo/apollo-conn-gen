import { Scalar } from './scalar';
import { Obj } from './obj';
import { trace } from '../log/trace';
import { Type } from './type';
import { Context } from '../context';
import { sanitiseField, sanitiseFieldForSelect } from '../naming';
import { IWriter } from '../../io/types';

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export class ArrayType extends Type {
  private arrayType: Type | null = null;

  constructor(name: string, parent: Type | null) {
    super(name, parent);
  }

  public setArrayType(type: Type): void {
    this.arrayType = type;
  }

  public getArrayType(): Type | null {
    return this.arrayType;
  }

  public write(context: Context, writer: IWriter): void {
    trace(context, '[array:write]', '-> in: ' + this.getName());
    const field = sanitiseField(this.getName());
    const itemsType = this.getArrayType();

    if (itemsType === null) {
      writer.write('### NO TYPE FOUND -- FIX MANUALLY! field: ' + field + ': [String]\n');
      return;
    }

    writer.write(this.indent(context));
    writer.write(field);
    writer.write(': [');

    if (itemsType instanceof Scalar) {
      writer.write(itemsType.getType());
    } else if (itemsType instanceof Obj) {
      writer.write(itemsType.getType());
    } else {
      writer.write(capitalize(itemsType.getName()));
    }

    writer.write(']');

    if (this.getName() !== field) {
      writer.write(' # ' + this.getName());
    }

    writer.write('\n');
    trace(context, '[array:write]', '<- out: ' + this.getName());
  }

  public select(context: Context, writer: IWriter): void {
    trace(context, '[array:select]', '-> in: ' + this.getName());
    const itemsType = this.getArrayType();

    if (itemsType instanceof Obj) {
      itemsType.select(context, writer);
    } else {
      const fieldName = sanitiseFieldForSelect(this.getName());
      writer.write(this.indent(context));
      writer.write(fieldName);
      writer.write('\n');
    }

    trace(context, '[array:select]', '<- out: ' + this.getName());
  }

  public toString(): string {
    return this.id() + '[' + (this.getArrayType() ? this.getArrayType()!.getName() : 'undefined') + ']';
  }

  public id(): string {
    return 'array:#' + super.id();
  }

  //   public equals(o: any): boolean {
  //     if (this === o) return true;
  //     if (!(o instanceof ArrayType)) return false;
  //     const other = o as ArrayType;
  //     if (this.arrayType === null && other.arrayType === null) return true;
  //     if (this.arrayType === null || other.arrayType === null) return false;
  //     return this.arrayType.equals(other.arrayType);
  //   }

  //   public hashCode(): number {
  //     let hash = super.hashCode();
  //     if (this.arrayType !== null) {
  //       hash = (Math.imul(31, hash) + this.arrayType.hashCode()) | 0;
  //     }
  //     return hash;
  //   }
}
