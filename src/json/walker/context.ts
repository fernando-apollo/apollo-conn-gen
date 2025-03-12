// import { trace } from './Trace'; // Uncomment if you wish to use tracing

import { Obj } from './types/obj';
import { Type } from './types/type';

export class Context {
  private stack: Type[];
  private types: Map<string, Type>;

  constructor() {
    this.stack = [];
    this.types = new Map<string, Type>();
  }

  public getStack(): Type[] {
    return this.stack;
  }

  public enter(element: Type): void {
    // trace(this, "[context]", "-> enter: (" + this.stack.length + ") " + element.getName());
    this.stack.push(element);
  }

  public leave(element: Type): void {
    // trace(this, "[context]", "<- leave: (" + this.stack.length + ") " + element.getName());
    this.stack.pop();
  }

  public store(type: Type): void {
    if (this.types.has(type.id())) {
      this.merge(type);
    } else {
      this.types.set(type.id(), type);
    }
  }

  private merge(type: Type): void {
    const source = this.types.get(type.id());
    // Only merge if both are Obj instances
    if (source instanceof Obj && type instanceof Obj) {
      type.getFields().forEach((value, key) => {
        source.getFields().set(key, value);
      });
      this.types.set(source.id(), source);
    }
  }

  public getTypes(): Type[] {
    return Array.from(this.types.values());
  }
}
