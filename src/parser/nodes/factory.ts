import {SchemaObject} from 'oas/types';
import {ReferenceObject} from './props/types';
import {Operation} from 'oas/operation';

import _ from 'lodash';

import {IType} from './type';

import Obj from './obj';
import Ref from './ref';
import Arr from './arr';
import PropRef from './props/prop_ref';
import PropArray from './props/prop_array';
import PropObj from './props/prop_obj';
import Context from '../context';
import Prop from './props/prop';
import Get from './get';
import Res from './res';
import {OpenAPIV3} from "openapi-types";
import Composed from "./comp";
import {Scalar} from "./scalar";
import GqlUtils from "../utils/gql";
import Naming from "../utils/naming";
import ArraySchemaObject = OpenAPIV3.ArraySchemaObject;
import PropScalar from "./props/prop_scalar";

export default class Factory {
  public static createGet(name: string, op: Operation): Get {
    // result.originalPath = name;
    // result.summary = op.summary;
    return new Get(name, op);
  }

  public static fromSchema(parent: IType, schema: SchemaObject): IType {
    let result: IType | null = null;

    if ('$ref' in schema) {
      result = new Ref(parent, schema.$ref as string, schema as ReferenceObject);
    }
    // array case
    else if (schema.type === 'array' && schema.items) {
      // Array schema case.
      let parentName = parent.name;
      if (parent instanceof Res) {
        // Assume parent.parent is a GetOp.
        const get = parent.parent as Get;
        parentName = _.capitalize(get.getGqlOpName());
      } else {
        console.log('Factory.fromSchema >>> HERE');
      }
      result = new Arr(parent, parentName, schema.items as ArraySchemaObject);
    }
    // array case
    else if (schema.type === 'object' && schema.properties) {
      // Object schema case.
      result = new Obj(parent, (schema as any).name || parent.name, schema);
    }
    // Composed schema case.
    else if (schema.allOf || schema.oneOf) {
      const composedSchema = schema as SchemaObject;

      result = new Composed(parent, (schema as any).name || parent.name, schema);
    }
    // scalar
    else {
      const typeStr = schema.type;
      if (typeStr != null) {
        if (typeStr === 'array') {
          throw new Error(
            `Should have been handled already? ${typeStr}, schema: ${JSON.stringify(
              schema
            )}`
          );
        } else if (schema.enum != null) {
          // TODO: Implement this.
          // result = new En(parent, schema, (schema as any).enum);
          throw new Error("En not implemented");
        }
        // scalar case
        else if (GqlUtils.gqlScalar(typeStr as string)) {
          const scalarType = GqlUtils.getGQLScalarType(schema);
          result = new Scalar(parent, scalarType, schema);
        } else {
          throw new Error(`Cannot handle property type ${typeStr}, schema: ${JSON.stringify(schema)}`
          );
        }
      } else {
        throw new Error(`Cannot handle schema ${parent.pathToRoot()}, schema: ${JSON.stringify(schema)}`);
      }
    }

    if (result != null) {
      parent.add(result);
    } else {
      throw new Error(`Not yet implemented for ${JSON.stringify(schema)}`);
    }

    return result;
  }

  public static fromProp(context: Context, parent: IType, propertyName: string, propertySchema: SchemaObject): Prop {
    if (!propertySchema) {
      throw new Error(
        `Should have a schema defined for property '${propertyName}' (parent: '${parent.name}')`
      );
    }

    const type = propertySchema.type;
    let prop: Prop;

    if (!type && ('$ref' in propertySchema)) {
      prop = new PropRef(parent, propertyName, propertySchema, propertySchema.$ref);
    }
    // uses the type of the schema to find out what kind of property it is
    else if (type) {
      // 1st case is if the type is an array
      if (type === "array") {
        const array = new PropArray(parent, propertyName, propertySchema);
        const itemsName = Naming.genArrayItems(propertyName);
        array.items = Factory.fromProp(context, array, itemsName, propertySchema.items as ArraySchemaObject);
        prop = array;
      }
      // 2nd checks for obj property
      else if (type === "object") {
        // the type of the property will be an object, which needs to be added as a child
        const propType: IType = new Obj(parent, propertyName, propertySchema);
        prop = new PropObj(parent, propertyName, propertySchema, propType);
      }
      // 3rd tries for scalar
      else if (GqlUtils.gqlScalar(type as string)) {
        let scalar = GqlUtils.gqlScalar(type as string);
        prop = new PropScalar(parent, propertyName, scalar as string, propertySchema);
      }
      // or we don't know how to handle this
      else {
        throw new Error("Cannot handle property type " + type);
      }
    }
    // otherwise let's use the properties instead and assume an Obj
    else if (propertySchema.properties != null) {
      const propType: IType = new Obj(parent, propertyName, propertySchema);
      prop = new PropObj(parent, propertyName, propertySchema, propType);
    }
    // default case, we don't know what to do so we'll create a scalar of type JSON
    else {
      prop = new PropScalar(parent, propertyName, "JSON", propertySchema);
    }

    if (parent.ancestors().includes(prop)) {
      console.warn("[factory] Recursion detected! Ancestors already contain this type: \n" + prop.pathToRoot());
    }

    return prop;
  }

  public static fromResponse(context: Context, parent: IType, mediaSchema: SchemaObject): IType {
    // const content = Factory.fromSchema(response, mediaSchema);
    // response.response = content;
    return new Res(parent, 'r', mediaSchema);
  }
}
