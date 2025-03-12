import { Operation } from 'oas/dist/operation';
import { ParameterObject, SchemaObject } from 'oas/dist/types';
import { ReferenceObject } from './props/types';

import _ from 'lodash';

import { IType } from './type';

import { OpenAPIV3 } from 'openapi-types';
import { trace, warn } from '../../log/trace';
import Context from '../context';
import GqlUtils from '../utils/gql';
import Naming from '../utils/naming';
import Arr from './arr';
import CircularRef from './circular_ref';
import Composed from './comp';
import En from './en';
import Get from './get';
import Obj from './obj';
import Param from './param/param';
import Prop from './props/prop';
import PropArray from './props/prop_array';
import PropObj from './props/prop_obj';
import PropRef from './props/prop_ref';
import ArraySchemaObject = OpenAPIV3.ArraySchemaObject;
import PropScalar from './props/prop_scalar';
import Ref from './ref';
import Response from './response';
import { Scalar } from './scalar';
import Union from './union';

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
      if (parent instanceof Response) {
        // Assume parent.parent is a GetOp.
        const get = parent.parent as Get;
        parentName = _.upperFirst(get.getGqlOpName());
      } else {
        trace(null, '[factory]', 'Factory.fromSchema >>> HERE');
      }
      result = new Arr(parent, parentName, schema.items as ArraySchemaObject);
    }
    // array case
    else if (schema.type === 'object') {
      if (schema.allOf || schema.oneOf) {
        result = new Composed(parent, _.get(schema, 'name') || parent.name, schema);
      } else {
        if (!schema.properties) {
          warn(
            null,
            '[factory]',
            'Object has no properties: ' + JSON.stringify(schema, null, 2) + ' in: ' + parent.pathToRoot(),
          );
        }

        result = new Obj(parent, _.get(schema, 'name') || null, schema);
      }
    }
    // Composed schema case.
    else if (schema.allOf || schema.oneOf) {
      result = new Composed(parent, _.get(schema, 'name') || parent.name, schema);
    }
    // scalar
    else {
      const typeStr = schema.type;
      if (typeStr != null) {
        if (typeStr === 'array') {
          throw new Error(`Should have been handled already? ${typeStr}, schema: ${JSON.stringify(schema)}`);
        } else if (schema.enum != null) {
          result = new En(parent, schema, schema.enum! as string[]);
        }
        // scalar case
        else if (GqlUtils.gqlScalar(typeStr as string)) {
          const scalarType = GqlUtils.getGQLScalarType(schema);
          result = new Scalar(parent, scalarType, schema);
        } else {
          throw new Error(`Cannot handle property type ${typeStr}, schema: ${JSON.stringify(schema)}`);
        }
      } else if (schema.enum != null) {
        result = new En(parent, schema, _.get(schema, 'enum') as string[]);
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

    if (!type && '$ref' in schema) {
      prop = new PropRef(parent, propertyName, schema, (schema as ReferenceObject).$ref);
    }
    // uses the type of the schema to find out what kind of property it is
    else if (type) {
      // 1st case is if the type is an array
      if (type === 'array') {
        const array = new PropArray(parent, propertyName, schema);

        const itemsName = Naming.genArrayItems(propertyName);
        const itemsType = Factory.fromProp(context, array, itemsName, schema.items as ArraySchemaObject);

        array.setItems(itemsType);

        prop = array;
      }
      // 2nd checks for obj property
      else if (type === 'object') {
        // the type of the property will be an object, which needs to be added as a child
        const propType: IType = new Obj(parent, propertyName, schema);
        prop = new PropObj(parent, propertyName, schema, propType);
      }
      // 3rd tries for scalar
      else if (GqlUtils.gqlScalar(type as string)) {
        const scalar = GqlUtils.gqlScalar(type as string);
        prop = new PropScalar(parent, propertyName, scalar as string, schema);
      }
      // or we don't know how to handle this
      else {
        throw new Error('Cannot handle property type ' + type);
      }
    }
    // otherwise let's use the properties instead and assume an Obj
    else if (schema.properties != null) {
      const propType: IType = new Obj(parent, propertyName, schema);
      prop = new PropObj(parent, propertyName, schema, propType);
    }
    // default case, we don't know what to do so we'll create a scalar of type JSON
    else {
      prop = new PropScalar(parent, propertyName, 'JSON', schema);
    }

    if (parent.ancestors().includes(prop)) {
      console.warn('[factory] Recursion detected! Ancestors already contain this type: \n' + prop.pathToRoot());
    }

    return prop;
  }

  public static fromResponse(_context: Context, parent: IType, mediaSchema: SchemaObject): IType {
    // const content = Factory.fromSchema(response, mediaSchema);
    // response.response = content;
    return new Response(parent, 'r', mediaSchema);
  }

  public static fromParam(context: Context, parent: IType, p: ParameterObject | ReferenceObject): Param {
    let param: ParameterObject;

    if ('$ref' in p) {
      const ref: ReferenceObject = p as ReferenceObject;
      const schema = context.lookupParam(ref.$ref);

      if (!schema) {
        throw new Error('Schema not found for ref: ' + ref.$ref);
      }
      param = schema as ParameterObject;
    } else {
      param = p as ParameterObject;
    }

    const schema = param.schema as SchemaObject;
    const required = param.required === true;

    return new Param(parent, param.name, schema, required, schema.default, param);
  }

  public static fromCircularRef(parent: IType, child: IType): IType {
    return new CircularRef(parent, child);
  }

  public static fromUnion(_context: Context, parent: IType, oneOfs: SchemaObject[]): IType {
    const union = new Union(parent, parent.name, oneOfs);
    parent.add(union);
    return union;
  }
}
