import Context from '../context';
import {trace} from '../../log/trace';
import {IType, Type} from './type';
import {SchemaObject} from 'oas/types';
import Prop from "./props/prop";
import Factory from "./factory";

export default class Obj extends Type {
  constructor(
    parent: IType | undefined,
    name: string,
    public schema: SchemaObject
  ) {
    super(parent, name);
  }

  describe(): string {
    return `Obj{name: ${this.name}}`;
  }

  get id(): string {
    return `obj:${this.name}`;
  }

  public visit(context: Context): void {
    if (this.visited) return;

    context.enter(this);
    trace(context, '-> [obj:visit]', 'in ' + this.name);

    // if (!context.inContextOf(Composed, this)) {
    //   console.log('In object: ' + (this.name ? this.name : this.getOwner()));
    // }

    this.visitProperties(context);
    this.visited = true;

    if (this.name) {
      context.store(this.name, this);
    }

    trace(context, '<- [obj:visit]', 'out ' + this.name);
    context.leave(this);
  }

  private visitProperties(context: Context): void {
    if (!this.schema.properties) return;

    const properties = this.schema.properties as Record<string, SchemaObject>;
    const propKeys = Object.keys(properties);
    trace(
      context,
      '-> [obj::props]',
      'in props ' + (propKeys.length === 0 ? '0' : propKeys.length.toString())
    );

    if (propKeys.length === 0) {
      trace(context, '<- [obj::props]', 'no props ' + this.props.size);
      return;
    }

    const sorted = Object.entries(properties)
      .sort((a, b) =>
        a[0].toLowerCase().localeCompare(b[0].toLowerCase())
      );

    for (const [key, schemaValue] of sorted) {
      const prop = Factory.fromProp(context, this, key, schemaValue);
      this.props.set(prop.name, prop);
      if (!this.children.includes(prop)) {
        this.add(prop);
      }
    }

    // const propertiesNames = Array.from(collected.values())
    //   .map((p) => p.forPrompt(context))
    //   .join(',\n - ');
    //
    // const inCompose = context.inContextOf(Composed, this);
    // const inComposeIdx = Type.findAncestorOf(this, Composed);
    // const inArrayIdx = Type.findAncestorOf(this, PropArray);
    //
    // if (!inCompose || inArrayIdx > inComposeIdx) {
    //   console.log('Obj.visitProperties HERE');
    // }
    //
    // trace(
    //   context,
    //   '   [obj::props]',
    //   `${this.getSimpleName()} is within compose context? ${inCompose}`
    // );
    //
    // const addAll =
    //   !inCompose || inArrayIdx > inComposeIdx
    //     ? await context.prompt.yesNoSelect(
    //       this.path(),
    //       ` -> Add all properties from [object] ${this.getOwner()}?: \n - ${propertiesNames}\n`
    //     )
    //     : 'y';
    //
    // if (addAll === 'y' || addAll === 's') {
    //   for (const [propertyName, propertySchema] of sorted) {
    //     const prop = Factory.fromProperty(
    //       context,
    //       this,
    //       propertyName,
    //       propertySchema
    //     );
    //     if (
    //       addAll === 'y' ||
    //       (await context.prompt.yesNo(
    //         prop.path(),
    //         `Add field '${prop.forPrompt(context)}'?`
    //       ))
    //     ) {
    //       trace(context, '   [obj::props]', 'prop: ' + prop);
    //       this.props.set(propertyName, prop);
    //       if (!this.children.includes(prop)) {
    //         this.add(prop);
    //       }
    //     }
    //   }
    // }
    //
    // this.addDependencies(context);
    trace(context, '<- [obj::props]', 'out props ' + this.props.size);
  }
}
