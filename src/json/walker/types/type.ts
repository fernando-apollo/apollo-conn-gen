import { IWriter } from "../../io/types";

export interface Context {
  getStack(): any[];
}

export abstract class Type {
  private readonly name: string;
  private readonly parent: Type | null;

  constructor(name: string, parent: Type | null) {
    this.name = name;
    this.parent = parent;
  }

  public getName(): string {
    return this.name;
  }

  public getParent(): Type | null {
    return this.parent;
  }

  public abstract write(context: Context, writer: IWriter): void;

  protected indent(context: Context): string {
    return " ".repeat(context.getStack().length);
  }

  protected indentWithSubstract(context: Context, subtract: number): string {
    return " ".repeat(context.getStack().length - subtract);
  }

  public abstract select(context: Context, writer: IWriter): void;

  public id(): string {
    let paths = "";
    let parent: Type | null = this;
    while ((parent = parent.getParent()) !== null) {
      paths = `/${parent.getName()}` + paths;
    }
    return paths + "/" + this.getName();
  }

  public equals(o: any): boolean {
    if (this === o) return true;
    if (!(o instanceof Type)) return false;
    return this.id() === o.id();
  }

  public hashCode(): number {
    let hash = 0;
    const id = this.id();
    for (let i = 0; i < id.length; i++) {
      hash = (Math.imul(31, hash) + id.charCodeAt(i)) | 0;
    }
    return hash;
  }
}
