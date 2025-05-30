import { IType, Kind, Prop } from './internal.js';
import { trace } from '../log/trace.js';
import { OasContext } from '../oasContext.js';
import { Writer } from '../io/writer.js';
import { Factory } from './factory.js';

export abstract class Type implements IType {
  public parent?: IType;
  public name: string;
  public children: IType[];
  public circularRef?: IType;
  public kind: Kind;
  public visited: boolean;

  private readonly _props: Map<string, Prop>;

  protected constructor(parent: IType | undefined, name: string) {
    this.parent = parent;
    this.name = name;
    this.children = [];
    this.visited = false;
    this._props = new Map<string, Prop>();
    this.kind = parent?.kind || 'type';
  }

  public abstract visit(context: OasContext): void;

  public abstract forPrompt(context: OasContext): string;

  public abstract select(context: OasContext, writer: Writer, selection: string[]): void;

  public find(path: string, collection: IType[]): IType | boolean {
    const parts = path.split('>');
    let current: IType | undefined;

    let i = 0;
    do {
      const part = parts[i];

      current = collection.find((t) => t.id === part);
      if (!current) {
        return false;
      }

      collection = Array.from(current!.children.values()) || Array.from(current!.props.values()) || [];
      // console.log("found", current);

      i++;
    } while (i < parts.length);

    return current || false;
  }

  public expand(context: OasContext): IType[] {
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

  public abstract generate(context: OasContext, writer: Writer, selection: string[]): void;

  get id() {
    return this.name;
  }

  get props() {
    return this._props;
  }

  public ancestors(): IType[] {
    return this.parent ? [...this.parent.ancestors(), this] : [this];
  }

  public path(): string {
    const ancestors = this.ancestors();
    return ancestors
      .map((t) => t.id)
      .join('>')
      .replace(/#\/components\/schemas/g, '#/c/s');
  }

  public pathToRoot(): string {
    let builder = '';
    let indent = 0;

    const ancestors = this.ancestors();
    for (let i = 0; i < ancestors.length; i++) {
      builder += ' <- ' + ' '.repeat(indent++) + ancestors[i].id + ' (' + ancestors[i].constructor.name + ')\n';
    }

    return builder;
  }

  public add(child: IType): IType {
    const paths: IType[] = this.ancestors();
    const contains: boolean = paths.map((p) => p.id).includes(child.id);
    let pushed = child;

    if (contains) {
      trace(null, '-> [type:add]', 'already contains child: ' + child.id);
      const ancestor: IType = paths[paths.map((p) => p.id).indexOf(child.id)];
      const wrapper = Factory.fromCircularRef(this, ancestor);
      this.children.push(wrapper);
      pushed = wrapper;
    } else {
      this.children.push(child);
    }

    return pushed;
  }

  public selectedProps(selection: string[]) {
    return Array.from(this.props.values()).filter((prop) => selection.find((s) => s.startsWith(prop.path())));
  }

  nameSuffix(): string {
    return this.kind === 'input' ? 'Input' : '';
  }
}
