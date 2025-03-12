import { IWriter } from "../../io/types";
import { Context } from "../context";
import { trace } from "../log/trace";
import { sanitiseField, sanitiseFieldForSelect } from "../naming";
import { Type } from "./type";

export class Scalar extends Type {
  private readonly type: string;

  constructor(name: string, parent: Type | null, type: string) {
    super(name, parent);
    this.type = type;
  }

  public getType(): string {
    return this.type;
  }

  public write(context: Context, writer: IWriter): void {
    trace(context, "[scalar:write]", "-> in: " + this.getName());
    writer.write(this.indent(context));

    const field = sanitiseField(this.getName());
    writer.write(field);

    writer.write(": ");
    writer.write(this.getType());
    writer.write("\n");
    trace(context, "[scalar:write]", "<- out: " + this.getName());
  }

  public select(context: Context, writer: IWriter): void {
    trace(context, "[scalar:select]", "-> in: " + this.getName());

    const originalName = this.getName();
    const fieldName = sanitiseFieldForSelect(originalName);

    writer.write(this.indent(context));
    writer.write(fieldName);
    writer.write("\n");

    trace(context, "[scalar:select]", "<- out: " + this.getName());
  }

  public toString(): string {
    return this.id() + "{" + this.getType() + "}";
  }

  public id(): string {
    return "scalar:#" + super.id();
  }

  public equals(o: any): boolean {
    if (this === o) return true;
    if (!(o instanceof Scalar)) return false;
    const nameIsEqual = this.getName() === o.getName();
    const typeIsEqual = this.type === o.type;
    return nameIsEqual && typeIsEqual;
  }

  public hashCode(): number {
    let hash = 0;
    const str = this.type;
    for (let i = 0; i < str.length; i++) {
      hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
    }
    return hash;
  }
}
