/* eslint-disable @typescript-eslint/no-explicit-any */
import { Context } from './context';
import { Type } from './types/type';
import { Obj } from './types/obj';
import { ArrayType } from './types/array';
import { trace, warn } from './log/trace';
import { Scalar } from './types/scalar';
import { sanitiseField } from './naming';
import _ from 'lodash';

export class Walker {
  private context: Context;

  // Private constructor
  private constructor() {
    this.context = new Context();
  }

  public getContext(): Context {
    return this.context;
  }

  // // Walks the provided file or folder (synchronously)
  // public walk(fileOrFolder: string): void {
  //   const stats = fs.statSync(fileOrFolder);
  //   if (stats.isDirectory()) {
  //     const sources = fs
  //       .readdirSync(fileOrFolder)
  //       .filter((name) => name.toLowerCase().endsWith('.json'));
  //     for (const source of sources) {
  //       const fullPath = path.join(fileOrFolder, source);
  //       this.walkSourceFile(fullPath);
  //     }
  //   } else {
  //     this.walkSourceFile(fileOrFolder);
  //   }
  // }

  // Factory method from file or folder
  // public static fromFileOrFolder(fileOrFolder: string): Walker {
  //   if (!fs.existsSync(fileOrFolder)) {
  //     throw new Error('Argument does not exist');
  //   }
  //   const walker = new Walker();
  //   walker.walk(fileOrFolder);
  //   return walker;
  // }

  public static new(): Walker {
    return new Walker();
  }

  // Factory method from a JSON string
  public static fromReader(json: string): Walker {
    const walker = new Walker();
    walker.walkJson(json);
    return walker;
  }

  // Writes selection using a given Writer
  public writeSelection(writer: { write(text: string): void }): void {
    const types = this.context.getTypes();
    const root = types.find((t) => t.getParent() === null);
    if (root) {
      root.select(this.context, writer);
    }
  }

  // Writes all types in order using the provided Writer
  public writeTypes(writer: { write(text: string): void }): void {
    const types = this.context.getTypes();
    const root = types.find((t) => t.getParent() === null);
    if (root) {
      const orderedSet = new Set<Type>();
      this.writeType(root, orderedSet);

      const generatedSet = new Map<string, Type>();
      orderedSet.forEach((t) => {
        // Assumes t is an Obj
        const obj = t as Obj;
        let typeName = obj.getType();
        if (generatedSet.has(typeName)) {
          // If same type, skip generation
          if (_.isEqual(obj, generatedSet.get(typeName))) {
            return;
          }
          obj.setType(Walker.generateNewObjType(generatedSet, t, typeName));
          typeName = obj.getType();
        }
        t.write(this.context, writer);
        generatedSet.set(typeName, t);
      });

      console.log('orderedSet =', Array.from(orderedSet));
    }
  }

  // Recursive helper to order types
  private writeType(type: Type, orderedSet: Set<Type>): void {
    if (type instanceof Obj) {
      // Traverse children first
      for (const child of Array.from((type as Obj).getFields().values())) {
        this.writeType(child, orderedSet);
      }
      orderedSet.add(type);
    } else if (type instanceof ArrayType) {
      const arrayType = (type as ArrayType).getArrayType();
      if (arrayType) {
        this.writeType(arrayType, orderedSet);
      }
    }
  }

  // // Walk a source file (given by path)
  // private walkSourceFile(source: string): void {
  //   trace(this.context, '-> [walkSource]', 'in: ' + path.basename(source));
  //   const fileContent = fs.readFileSync(source, 'utf-8');
  //   this.walkReader(fileContent);
  //   trace(this.context, '<- [walkSource]', 'out: ' + path.basename(source));
  // }

  // Walk the JSON provided as a string
  public walkJson(json: string): void {
    const rootElement = JSON.parse(json);
    this.walkElement(this.context, null, 'root', rootElement);
    trace(this.context, '   [walkSource]', 'types found: ' + this.context.getTypes().length);
  }

  // Walk an element in the JSON tree
  private walkElement(context: Context, parent: Type | null, name: string, element: any): Type {
    trace(context, '-> [walkElement]', 'in: ' + name);
    let result: Type;

    if (typeof element === 'object' && !Array.isArray(element) && element !== null) {
      // JSON object
      result = this.walkObject(context, parent, name, element);
      context.store(result);
    } else if (Array.isArray(element)) {
      result = this.walkArray(context, parent, name, element);
    } else if (typeof element === 'string' || typeof element === 'number' || typeof element === 'boolean') {
      result = this.walkPrimitive(context, parent, name, element);
    } else {
      throw new Error("Cannot yet handle '" + name + "' of type " + typeof element);
    }

    trace(context, '<- [walkElement]', 'out: ' + name);
    return result;
  }

  // Walk a JSON object
  private walkObject(context: Context, parent: Type | null, name: string, object: any): Obj {
    trace(context, '-> [walkObject]', 'in: ' + name);
    const result = new Obj(name, parent);
    const fieldSet = Object.keys(object);
    trace(context, '  [walkObject]', 'fieldSet: ' + fieldSet);

    for (const field of fieldSet) {
      trace(context, '  [walkObject]', 'field: ' + field);
      const childElement = object[field];
      const type = this.walkElement(context, result, field, childElement);
      result.add(field, type);
    }

    trace(context, '<- [walkObject]', 'out: ' + name);
    return result;
  }

  // Walk a JSON array
  private walkArray(context: Context, parent: Type | null, name: string, array: any[]): ArrayType {
    trace(context, '-> [walkArray]', 'in: ' + name);
    const result = new ArrayType(name, parent);
    if (array.length > 0) {
      const firstElement = array[0];
      const arrayType = this.walkElement(context, parent, name, firstElement);
      result.setArrayType(arrayType);
    } else {
      warn(context, '   [walkArray]', "Array is empty -- cannot derive type for field '" + name + "'");
    }
    trace(context, '-> [walkArray]', 'in: ' + name);
    return result;
  }

  // Walk a primitive JSON value
  private walkPrimitive(context: Context, parent: Type | null, name: string, primitive: any): Scalar {
    let result: Scalar;
    if (typeof primitive === 'string') {
      result = new Scalar(name, parent, 'String');
    } else if (typeof primitive === 'boolean') {
      result = new Scalar(name, parent, 'Boolean');
    } else if (typeof primitive === 'number') {
      result = new Scalar(name, parent, 'Int');
    } else {
      throw new Error('Cannot yet handle primitive: ' + primitive);
    }
    return result;
  }

  // Utility method for naming conflict resolution
  private static generateNewObjType(generatedSet: Map<string, Type>, t: Type, typeName: string): string {
    let newName: string;
    let type: Type | null = t;
    do {
      const parent: Type | null = type.getParent();
      const parentName = parent === null ? '' : sanitiseField(parent.getName()).replace(/^\w/, (c) => c.toUpperCase());
      const thisName = sanitiseField(typeName).replace(/^\w/, (c) => c.toUpperCase());
      newName = parentName + thisName;
      type = parent;
    } while (type !== null && generatedSet.has(newName));
    return newName;
  }
}
