import {IType, Type} from "./type";
import Context from "../context";
import {SchemaObject} from 'oas/dist/types';
import {trace} from "../../log/trace";
import Prop from "./props/prop";
import Factory from "./factory";
import Writer from "../io/writer";
import Naming from "../utils/naming";
import Ref from "./ref";
import PropRef from "./props/prop_ref";

;

export default class Composed extends Type {
  constructor(parent: IType | undefined, public name: string, public schema: SchemaObject) {
    super(parent, name);
  }

  get id(): string {
    return `comp:${this.name}`;
  }

  forPrompt(_context: Context): string {
    return `${Naming.getRefName(this.name)} (Comp)`;;
  }

  visit(context: Context): void {
    if (this.visited) return;

    context.enter(this);
    trace(context, '-> [composed:visit]', 'in: ' + (this.name == null ? '[object]' : this.name));

    // If not in the context of a Composed or Param, log the composed schema.
    if (!context.inContextOf("Composed", this) && !context.inContextOf("Param", this)) {
      trace(context, "[comp]", 'In composed schema: ' + this.name);
    }

    const composedSchema = this.schema;
    // this will be a type declaration
    if (composedSchema.allOf != null) {
      this.visitAllOfNode(context, composedSchema);
    }
    // represents a Union type
    else if (composedSchema.oneOf != null) {
      this.visitOneOfNode(context, composedSchema);
    }
    // can't hand this yet
    else {
      throw new Error('Composed.visit: unsupported composed schema: ' + this.schema);
    }

    this.visited = true;
    trace(context, '<- [composed:visit]', 'out: ' + this.name);
    context.leave(this);
  }

  generate(context: Context, writer: Writer, selection: string[]): void {
    context.enter(this);
    trace(context, '-> [comp::generate]', `-> in: ${this.name}`);

    const composedSchema = this.schema;
    if (composedSchema.oneOf != null) {
      if (this.children.length > 0) {
        this.children[0].generate(context, writer, selection);
      }
    } else if (composedSchema.allOf != null) {
      const selected = this.selectedProps(selection);

      if (selected.length > 0) {
        writer.write('type ');
        writer.write(Naming.getRefName(this.name));
        writer.write(' {\n');

        for (const prop of selected) {
          trace(context, '   [comp::generate]', `-> property: ${prop.name} (parent: ${prop.parent!.name})`);
          prop.generate(context, writer, selection);
        }

        writer.write('}\n\n');
      }
    }

    trace(context, '<- [comp::generate]', `-> out: ${this.name}`);
    context.leave(this);
  }

  select(context: Context, writer: Writer, selection: string[]) {
    trace(context, '-> [comp::select]', `-> in: ${this.name}`);

    const composedSchema = this.schema;
    if (composedSchema.allOf != null) {
      const selected = this.selectedProps(selection);

      for (const prop of selected) {
        prop.select(context, writer, selection);
      }
    }
    else if (composedSchema.oneOf != null) {
      if (this.children.length === 1) {
        this.children[0].select(context, writer, selection);
      } else {
        throw new Error('Expected exactly one child for a oneOf schema');
      }
    }

    trace(context, '<- [comp::select]', `-> out: ${this.name}`);
  }

  private visitAllOfNode(context: Context, schema: SchemaObject): void {
    const allOfs = schema.allOf || [];
    const refs = allOfs.map((s) => (s as any).$ref);

    trace(context, '-> [composed::all-of]', `in: '${this.name}' of: ${allOfs.length} - refs: ${refs}`);

    for (let i = 0; i < allOfs.length; i++) {
      const allOfItemSchema = allOfs[i];

      const type = Factory.fromSchema(this, allOfItemSchema as SchemaObject);
      trace(context, '   [composed::all-of]', 'allOf type: ' + type);

      if (type) {
        type.visit(context);
      }
    }

    trace(context, '-> [composed]', 'storing: ' + this.name + ' with: ' + this);
    context.store(this.name, this);
    trace(context, '<- [composed::all-of]', `out: '${this.name}' of: ${allOfs.length} - refs: ${refs}`);
  }

  private visitOneOfNode(context: Context, schema: SchemaObject): void {
    const oneOfs = schema.oneOf || [];
    trace(context, '-> [composed::one-of]', `in: OneOf ${this.name} with size: ${oneOfs.length}`);

    const result = Factory.fromUnion(context, this, oneOfs as SchemaObject[]);
    if (!result) {
      throw new Error('Failed to create union type');
    }

    result.visit(context);

    trace(context, '-> [composed::one-of]', `storing: ${this.name} with: ${this}`);
    if (this.name != null) {
      context.store(this.name, this);
    }

    trace(context, '<- [composed::one-of]', `out: OneOf ${this.name} with size: ${oneOfs.length}`);
  }

  public consolidate(selection: string[]): Set<string> {
    const ids: Set<string> = new Set()
    let props: Map<string, Prop> = new Map()

    const queue: IType[] = Array.from(this.children.values())
      .filter(child => !(child instanceof Prop));

    while (queue.length > 0) {
      const node = queue.shift()!

      ids.add((node instanceof Ref)
          ? (node as any).refType!.id
          : node.id
      )

      if (selection.length > 0) {
        node.props.forEach((prop) => {
          if (selection.find(s => s.startsWith(prop.path())))
            props.set(prop.name, prop);
        })
      }
      else {
        node.props.forEach((prop) => props.set(prop.name, prop));
      }

      // sort props
      props = new Map([...props.entries()].sort());

      const children = Array.from(node.children.values())
        .filter(child => !(child instanceof Prop))

      queue.push(...children);
    }

    // copy all collected props from children into this node
    props.forEach((prop) => this.props.set(prop.name, prop));

    // and return the types.ts we've used
    return ids
  }
}