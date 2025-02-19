import {IType, Type} from "./type";
import {SchemaObject} from "oas/dist/types";
import Context from "../context";
import {trace} from "../../log/trace";
import Composed from "./comp";
import Prop from "./props/prop";
import Factory from "./factory";
import Param from "./param/param";
import Writer from "../io/writer";


export default class Union extends Type {
  public schemas: SchemaObject[];

  constructor(parent: IType, name: string, schemas: SchemaObject[]) {
    super(parent, name);
    this.schemas = schemas;
  }

  get id(): string {
    return `union:${this.name}`;
  }

  forPrompt(context: Context): string {
    throw new Error("Method not implemented.");
  }

  public visit(context: Context): void {
    if (this.visited) return;
    const schemas = this.schemas.map((s) => s.type);

    context.enter(this);
    trace(context, '-> [union:visit]', 'in: ' + schemas);

    if (!context.inContextOf("Composed", this)) {
      console.log('In union: ' + this.parent?.name);
    }

    const collected = new Map<string, Prop>();

    for (const refSchema of this.schemas) {
      const type = Factory.fromSchema(this, refSchema);
      trace(context, ' [union:visit]', 'of type: ' + type);
      type.visit(context);
      for (const [key, prop] of type.props) {
        collected.set(key, prop);
      }
    }

    if (!context.inContextOf("Param", this)) {
      this.visitProperties(context, collected);
    }

    if (this.name != null) {
      context.store(this.name, this);
    }

    this.visited = true;
    trace(context, '<- [union:visit]', 'out: ' + schemas);
    context.leave(this);
  }

  private visitProperties(context: Context, collected: Map<string, Prop>): void {
    const propertiesNames = Array.from(collected.values())
      .map((p) => p.name)
      .join(',\n - ');

    for (const [_, prop] of collected.entries()) {
      trace(context, '   [union]', 'prop: ' + prop);
      this.props.set(prop.name, prop);

      if (!this.children.includes(prop))
        this.add(prop);
    }
  }

  public generate(context: Context, writer: Writer, selection: string[]): void {
    context.enter(this);
    const schemas = this.schemas.map((s) => s.type);
    trace(context, '-> [union::generate]', 'in: ' + schemas);

    /* params with Unions are weird, but here's an example:
     * id: oneOf [string, Enum {me}] */
    if (context.inContextOf("Param", this)) {
      for (const child of this.children) {
        child.generate(context, writer, selection);
      }
    }
    else {
      // When generating this union in GQL it might look like:
      // union MyUnion = Type1 | Type2 | Type3
      writer
        .append('#### NOT SUPPORTED YET BY CONNECTORS!!! union ')
        .append(this.name)
        .append(' = ');

      const childrenNames = this.children
        .map((child) => child.name)
        .join('# | ');

      writer.append(childrenNames).append('#\n\n');

      trace(context, '   [union::generate]', `[union] -> object: ${this.name}`);

      writer
        .append('type ')
        .append(this.name)
        .append(' { #### replacement for Union ')
        .append(this.name)
        .append('\n');


      const selected = this.selectedProps(selection);
      for (const prop of selected) {
        trace(context, '   [union::generate]', `-> property: ${prop.name} (parent: ${prop.parent!.name})`);
        prop.generate(context, writer, selection);
      }

      writer
        .append('} \n### End replacement for ')
        .append(this.name)
        .append('\n\n');
    }

    trace(context, '<- [union::generate]', 'out: ' + schemas);
    context.leave(this);
  }

/*
  public dependencies(context: Context): Set<IType> {
    if (!this.visited) {
      this.visit(context);
    }

    context.enter(this);
    trace(
      context,
      '-> [union:dependencies]',
      'in: ' + JSON.stringify(this.schemas.map((s) => s))
    );

    const set = new Set<IType>();
    const propsArray = Array.from(this.props.values()).filter(
      (p) =>
        p instanceof PropRef || p instanceof PropArray || p instanceof PropObj
    );
    for (const p of propsArray) {
      const deps = p.dependencies(context);
      for (const d of deps) {
        set.add(d);
      }
    }

    trace(
      context,
      '<- [union:dependencies]',
      'out: ' + JSON.stringify(this.schemas.map((s) => s))
    );
    context.leave(this);
    return set;
  }
*/

  public select(context: Context, writer: Writer, selection: string[]): void {
    trace(context, '-> [union::select]', `-> in: ${this.name}`);
    const selected = this.selectedProps(selection);

    for (const prop of selected) {
      prop.select(context, writer, selection);
    }

    trace(context, '<- [union::select]', `-> out: ${this.name}`);
  }
}
