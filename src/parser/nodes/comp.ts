import {IType, Type} from "./type";
import Context from "../context";
import {SchemaObject} from "oas/types";
import {trace} from "../../log/trace";
import Prop from "./props/prop";
import Factory from "./factory";

export default class Composed extends Type {
  constructor(parent: IType | undefined, public name: string, public schema: SchemaObject) {
    super(parent, name);
  }

  get id(): string {
    return `comp:${this.name}`;
  }

  describe(): string {
    return "";
  }

  visit(context: Context): void {
    if (this.visited) return;

    context.enter(this);
    trace(context, '-> [composed:visit]', 'in: ' + (this.name == null ? '[object]' : this.name));

    // If not in the context of a Composed or Param, log the composed schema.
    // TODO: pending
    // if (!context.inContextOf(Composed, this) && !context.inContextOf(Param, this)) {
    //   console.log('In composed schema: ' + this.name);
    // }

    const composedSchema = this.schema;
    // this will be a type declaration
    if (composedSchema.allOf != null) {
      this.visitAllOfNode(context, composedSchema);
    }
    // represents a Union type
    else if (composedSchema.oneOf != null) {
      // TODO: implement
      // this.visitOneOfNode(context, composedSchema);
    }
    // can't hand this yet
    else {
      throw new Error('Composed.visit: unsupported composed schema: ' + this.schema);
    }

    this.visited = true;
    trace(context, '<- [composed:visit]', 'out: ' + this.name);
    context.leave(this);
  }

  private visitAllOfNode(context: Context, schema: SchemaObject): void {
    const allOfs = schema.allOf || [];
    const refs = allOfs.map((s) => (s as any).$ref);

    trace(context, '-> [composed::all-of]', `in: '${this.name}' of: ${allOfs.length} - refs: ${refs}`);

    // const collected = new Map<string, Prop>();

    for (let i = 0; i < allOfs.length; i++) {
      const allOfItemSchema = allOfs[i];

      const type = Factory.fromSchema(this, allOfItemSchema as SchemaObject);
      trace(context, '   [composed::all-of]', 'allOf type: ' + type);

      if (type) {
        // we are not visiting the child nodes now - we'll leave them as it is
        // type.visit(context);
        // for (const [key, prop] of type.props.entries()) {
        //   collected.set(key, prop);
        // }
      }
    }

    // const inCompose = context.inContextOf(Composed, this);
    // const inComposeIdx = Type.findAncestorOf(this, Composed);
    // const inArrayIdx = Type.findAncestorOf(this, PropArray);
    // if (!inCompose || inArrayIdx > inComposeIdx) {
    //   this.promptPropertySelection(context, collected);
    // } else {
    // for (const [key, prop] of collected.entries()) {
    //   this.props.set(key, prop);
    // }
    // }

    trace(context, '-> [composed]', 'storing: ' + this.name + ' with: ' + this);
    context.store(this.name, this);
    trace(context, '<- [composed::all-of]', `out: '${this.name}' of: ${allOfs.length} - refs: ${refs}`);
  }
}