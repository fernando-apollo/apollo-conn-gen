import Context from "../context";
import Prop from "./props/prop";
import Writer from "../io/writer";
import {trace} from "../../log/trace";
import {RenderContext} from "../../prompts/theme";

export interface IType {
  name: string;
  parent?: IType;
  children: IType[];
  circularRef?: IType;
  props: Map<string, Prop>;
  id: string;

  forPrompt(context: Context): string;

  add(child: IType): void;

  ancestors(): IType[];

  visit(context: Context): void;

  generate(context: Context, writer: Writer, selection: string[]): void;

  pathToRoot(): string;

  path(): string;

  expand(context: Context): IType[];

  find(path: string, collection: Array<IType>): IType | boolean;

  select(context: Context, writer: Writer, selection: string[]): void;
}

export abstract class Type implements IType {
  public parent?: IType;
  public name: string;
  public children: IType[];
  circularRef?: IType;
  public props: Map<string, Prop>;
  public visited: boolean;

  protected constructor(parent: IType | undefined, name: string) {
    this.parent = parent;
    this.name = name;
    this.children = [];
    this.props = new Map<string, Prop>();
    this.visited = false;
  }

  abstract visit(context: Context): void;

  abstract forPrompt(context: Context): string;

  abstract select(context: Context, writer: Writer, selection: string[]): void;

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

  abstract generate(context: Context, writer: Writer, selection: string[]): void;

  get id() { return this.name; }

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

  public add(child: IType): void {
    this.children.push(child);
  };

  /*
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
  */

  public selectedProps(selection: string[]) {
    return Array.from(this.props.values())
      .filter((prop) => selection.find(s => s.startsWith(prop.path())));
  }
}