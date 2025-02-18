import {ParameterObject, SchemaObject} from 'oas/dist/types';
import {ReferenceObject} from './props/types';
import {Operation} from 'oas/dist/operation';

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
import Param from "./param/param";
import En from "./en";
import CircularRef from "./circular_ref";

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
        parentName = _.upperFirst(get.getGqlOpName());
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
      const _composedSchema = schema as SchemaObject;
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
          result = new En(parent, schema, (schema as any).enum);
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

  public static fromProp(context: Context, parent: IType, propertyName: string, schema: SchemaObject): Prop {
    if (!schema) {
      throw new Error(`Should have a schema defined for property '${propertyName}' (parent: '${parent.name}')`);
    }

    const type = schema.type;
    let prop: Prop;

    if (!type && ('$ref' in schema)) {
      prop = new PropRef(parent, propertyName, schema, (schema as ReferenceObject).$ref);
    }
    // uses the type of the schema to find out what kind of property it is
    else if (type) {
      // 1st case is if the type is an array
      if (type === "array") {
        const array = new PropArray(parent, propertyName, schema);
        const itemsName = Naming.genArrayItems(propertyName);
        array.setItems(Factory.fromProp(context, array, itemsName, schema.items as ArraySchemaObject));
        prop = array;
      }
      // 2nd checks for obj property
      else if (type === "object") {
        // the type of the property will be an object, which needs to be added as a child
        const propType: IType = new Obj(parent, propertyName, schema);
        prop = new PropObj(parent, propertyName, schema, propType);
      }
      // 3rd tries for scalar
      else if (GqlUtils.gqlScalar(type as string)) {
        let scalar = GqlUtils.gqlScalar(type as string);
        prop = new PropScalar(parent, propertyName, scalar as string, schema);
      }
      // or we don't know how to handle this
      else {
        throw new Error("Cannot handle property type " + type);
      }
    }
    // otherwise let's use the properties instead and assume an Obj
    else if (schema.properties != null) {
      const propType: IType = new Obj(parent, propertyName, schema);
      prop = new PropObj(parent, propertyName, schema, propType);
    }
    // default case, we don't know what to do so we'll create a scalar of type JSON
    else {
      prop = new PropScalar(parent, propertyName, "JSON", schema);
    }

    if (parent.ancestors().includes(prop)) {
      console.warn("[factory] Recursion detected! Ancestors already contain this type: \n" + prop.pathToRoot());
    }

    return prop;
  }

  public static fromResponse(_context: Context, parent: IType, mediaSchema: SchemaObject): IType {
    // const content = Factory.fromSchema(response, mediaSchema);
    // response.response = content;
    return new Res(parent, 'r', mediaSchema);
  }

  public static fromParam(context: Context, parent: IType, p: ParameterObject): Param {
    if ('$ref' in p) throw new Error(`Don't know how to handle ref params yet: ${JSON.stringify(p)}`);

    const schema = p.schema as SchemaObject;
    const required = p.required === true;

    return new Param(parent, p.name, schema, required, schema.default, p);
  }

  public static fromCircularRef(parent: IType, child: IType): IType {
    return new CircularRef(parent, child);
  }
}
