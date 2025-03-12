import { IWriter } from "../../io/types";
import { Context } from "../context";
import { trace } from "../log/trace";
import { sanitiseField, sanitiseFieldForSelect } from "../naming";
import { Type } from "./type";

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export class Obj extends Type {
  private type: string;
  private fields: Map<string, Type>;

  constructor(name: string, parent: Type | null) {
    super(name, parent);
    this.type = Obj.generateType(parent, name);
    this.fields = new Map<string, Type>();
  }

  private static generateType(parent: Type | null, name: string): string {
    const parentName =
      parent === null ? "" : capitalize(sanitiseField(parent.getName()));
    return parentName + capitalize(sanitiseField(name));
  }

  public add(field: string, type: Type): void {
    this.fields.set(field, type);
  }

  public getFields(): Map<string, Type> {
    return this.fields;
  }

  public getType(): string {
    return this.type;
  }

  public setType(type: string): void {
    this.type = type;
  }

  public write(context: Context, writer: IWriter): void {
    if (this.fields.size === 0) return;
    trace(context, "[obj:write]", "-> in: " + this.getType());
    context.enter(this);
    writer.write("type " + this.getType() + " {\n");

    for (const field of this.fields.values()) {
      if (field instanceof Obj) {
        const name = sanitiseField(field.getName());
        writer.write(
          this.indent(context) + name + ": " + field.getType() + "\n",
        );
      } else {
        field.write(context, writer);
      }
    }

    writer.write("}\n");
    context.leave(this);
    trace(context, "[obj:write]", "<- out: " + this.getType());
  }

  public select(context: Context, writer: IWriter): void {
    if (this.fields.size === 0) return;
    trace(context, "[obj:select]", "-> in: " + this.getName());
    context.enter(this);

    if (this.getParent() !== null) {
      writer.write(
        this.indentWithSubstract(context, 1) +
          sanitiseFieldForSelect(this.getName()) +
          " {\n",
      );
    }

    for (const field of this.fields.values()) {
      field.select(context, writer);
    }

    if (this.getParent() !== null) {
      writer.write(this.indentWithSubstract(context, 1) + "}\n");
    }

    context.leave(this);
    trace(context, "[obj:select]", "<- out: " + this.getName());
  }

  public toString(): string {
    return (
      "obj:" +
      this.getName() +
      ":{" +
      Array.from(this.fields.keys()).join(",") +
      "}"
    );
  }

  public id(): string {
    return "obj:#" + super.id();
  }

  public equals(o: any): boolean {
    if (this === o) return true;
    if (!(o instanceof Obj)) return false;
    const other = o as Obj;
    if (this.fields.size !== other.fields.size) return false;
    for (const [key, value] of this.fields.entries()) {
      const otherValue = other.fields.get(key);
      if (!otherValue || !value.equals(otherValue)) {
        return false;
      }
    }
    return true;
  }

  public hashCode(): number {
    let hash = 0;
    const str = this.type;
    for (let i = 0; i < str.length; i++) {
      hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
    }
    for (const key of Array.from(this.fields.keys()).sort()) {
      for (let i = 0; i < key.length; i++) {
        hash = (Math.imul(31, hash) + key.charCodeAt(i)) | 0;
      }
    }
    return hash;
  }
}
