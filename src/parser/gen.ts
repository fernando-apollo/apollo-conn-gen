import Oas from 'oas';
import OASNormalize from 'oas-normalize';
import { Operation, Webhook } from 'oas/dist/operation';
import { OASDocument } from 'oas/dist/types';
import { OpenAPI } from 'openapi-types';

import fs from 'fs';
import { trace } from '../log/trace';
import Context from './context';
import Factory from './nodes/factory';
import { IType } from './nodes/type';

interface IGenOptions {
  skipValidation: boolean;
}

export default class Gen {
  public static async fromFile(
    sourceFile: string,
    options: IGenOptions = {
      skipValidation: false,
    },
    // prompt: Prompt
  ): Promise<Gen> {
    if (!fs.existsSync(sourceFile)) {
      throw new Error('Source not found: ' + sourceFile);
    }

    // const options = { resolve: true, resolveCombinators: false };
    // const parser = new OpenAPIV3Parser().read(source, null, options);
    const normalizer: OASNormalize = new OASNormalize(sourceFile, {
      enablePaths: true,
    });

    const _loaded: Record<string, unknown> = await normalizer.load();
    console.log('loaded file');

    const _normalised: OpenAPI.Document = await normalizer.bundle();
    console.log('loaded bundle');

    if (!options.skipValidation) {
      const validated: boolean = await normalizer.validate();
      if (!validated) {
        console.log('validated', validated);
        throw new Error('Could not validate source file');
      }
    }

    const json = await normalizer.convert();
    console.log('converted');

    const parser: Oas = new Oas(json as OASDocument);
    // return new ConnectorGen(parser, prompt);
    return new Gen(parser);
  }
  public parser: Oas;
  // public prompt: Prompt;
  public context?: Context;
  public paths: Map<string, IType> = new Map();

  constructor(parser: Oas) {
    this.parser = parser;
    // this.prompt = prompt;
  }

  public async visit(): Promise<void> {
    const parser = this.parser;
    const context = this.getContext();

    const paths = parser.getPaths();
    const filtered = Object.entries(paths)
      .filter(([_key, pathItem]) => pathItem.get !== undefined)
      .sort((a, b) => a[0].localeCompare(b[0], undefined, { sensitivity: 'base' }));

    const collected = new Map<string, IType>();
    for (const [key, pathItem] of filtered) {
      const result = this.visitPath(context, key, pathItem);
      collected.set(key, result);
    }

    this.paths = collected;
  }

  public getContext(): Context {
    if (!this.context) {
      this.context = new Context(this.parser);
    }
    return this.context;
  }

  public expand(type: IType): IType[] {
    const ctx = this.getContext();
    const path = type.path();

    trace(ctx, '-> [expand]', `in: path: ${path}`);
    type.visit(ctx);
    trace(ctx, '<- [expand]', `out: path: ${path}`);

    return type.children;
  }

  public find(path: string): IType | boolean {
    for (const [_name, type] of this.paths) {
      if (type.path() === path) {
        return type;
      }

      type.visit(this.getContext());

      const result = type.find(path, type.children);
      if (result) {
        return result;
      }
    }

    return false;
  }

  private visitGet(_context: Context, name: string, op: Operation): IType {
    // TODO
    // operation.visit(context);
    return Factory.createGet(name, op);
  }

  private printRefs(values: Map<string, number>): void {
    console.log('----------- ref count -------------- ');
    values.forEach((value, key) => {
      console.log(key + ' -> ' + value);
    });
  }

  private visitPath(context: Context, name: string, pathItem: Record<string, Webhook | Operation>): IType {
    const operation = pathItem.get;
    if (operation.constructor.name === 'Webhook') {
      throw new Error('Webhook not supported');
    }

    trace(context, '-> [visitPath]', `in:  [${name}] id: ${operation.getOperationId()}`);
    const type = this.visitGet(context, name, operation);
    trace(context, '<- [visitPath]', `out: [${name}] id: ${operation.getOperationId()}`);

    return type;
  }
}
