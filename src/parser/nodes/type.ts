import Context from "../context";
import Prop from "./props/prop";
import Writer from "../io/writer";
import {trace} from "../../log/trace";

export interface IType {
  name: string;
  parent?: IType;
  children: IType[];
  circularRef?: IType;
  props: Map<string, Prop>;
  id: string;

  describe(): string;

  add(node: IType): void;

  ancestors(): IType[];

  visit(context: Context): void;

  generate(context: Context, writer: Writer): void;

  pathToRoot(): string;

  path(): string;

  expand(context: Context): IType[];

  find(path: string, collection: Array<IType>): IType | boolean;
}

export abstract class Type implements IType {
  parent?: IType;
  name: string;
  children: IType[];
  circularRef?: IType;
  props: Map<string, Prop>;
  visited: boolean;

  protected constructor(parent: IType | undefined, name: string) {
    this.parent = parent;
    this.name = name;
    this.children = [];
    this.props = new Map<string, Prop>();
    this.visited = false;
  }

  abstract visit(context: Context): void;

  abstract describe(): string;

  find(path: string, collection: Array<IType>): IType | boolean {
    let found: IType | boolean = false;
    for (const type of collection) {
      if (type.path() === path) {
        found = type;
        break;
      }
    }
    if (!found) {
      for (const type of collection) {
        for (const prop of Array.from(type.props.values())) {
          if (prop.path() === path) {
            found = prop;
            break;
          }
        }
        if (found)
          break;
      }
    }
    if (!found) {
      for (const type of collection) {
        found = this.find(path, type.children);
        if (found)
          break;
      }
    }
    return found || false;
  }

  expand(context: Context): IType[] {
    trace(context, '-> [expand]', `in: path: ${this.path()}`);
    if (!this.visited) {
      this.visit(context);
    }

    trace(context, '<- [expand]', `out: path: ${this.path()}`);

    // TODO:
    // if ((type instanceof Composed || type instanceof Union) && !type.getProps().isEmpty()) {
    //   return type.props?.values() || [];
    // }
    // else {
    return this.children;
    // }
  }

  generate(context: Context, writer: Writer): void {
    throw new Error("Method not implemented.");
  }

  get id() {
    return this.name;
  }

  ancestors(): IType[] {
    const result: Array<IType> = [];
    result.push(this);

    let parent: IType | undefined = this;
    while (parent.parent) {
      parent = parent.parent;
      result.unshift(parent);
    }

    return result;
  }

  public path(): string {
    const ancestors = this.ancestors();
    return ancestors
      .map((t) => t.id)
      .join('>')
      .replace(/#\/components\/schemas/g, '#/c/s');
  }

  pathToRoot(): string {
    let builder = '';
    let current: IType | undefined = this;
    let indent = 0;

    while (current) {
      builder += ' <- ' + ' '.repeat(indent++) + current.id + ' (' + current.constructor.name + ')\n';
      current = current.parent;
    }

    return builder;
  }

  add = (node: IType): void => {
    this.children.push(node);
  };

  remove = (value: IType): void => {
    const index = this.children.findIndex(child => child === value);
    if (index !== -1) {
      this.children.splice(index, 1);
    }
  };

  traverse = (callback: (node: IType) => void, context: Context): void => {
    const traverseNode = (node: IType): void => {
      context.enter(node);
      callback(node);
      for (const child of node.children) {
        traverseNode(child);
      }
      context.leave(node);
    };

    traverseNode(this);
  };

  traverseBreadthFirst(callback: (node: IType) => void): void {
    const queue: IType[] = [this];

    while (queue.length > 0) {
      const node = queue.shift()!;
      callback(node);
      queue.push(...node.children);
    }
  }
}