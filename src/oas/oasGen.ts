import Oas from 'oas';
import OASNormalize from 'oas-normalize';
import { Operation, Webhook } from 'oas/operation';
import { HttpMethods, OASDocument } from 'oas/types';
import { OpenAPI } from 'openapi-types';

import fs from 'fs';
import { GenerateOptions, OasContext } from './oasContext.js';
import { Factory, IType } from './nodes/internal.js';
import { Writer } from './io/writer.js';
import { trace } from './log/trace.js';
import { TypesCollector } from './generator/typesCollector.js';

interface IGenOptions {
  skipValidation: boolean;
  consolidateUnions: boolean;
  showParentInSelections: boolean;
}

export class OasGen {
  public selections: string[] = [];
  private visited: boolean = false;

  public static async fromData(
    data: ArrayBuffer,
    options: IGenOptions = {
      skipValidation: false,
      consolidateUnions: true,
      showParentInSelections: false,
    },
  ): Promise<OasGen> {
    const normalizer: OASNormalize = new OASNormalize(data, {
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
    return new OasGen(parser, options);
  }

  public static async fromFile(
    sourceFile: string,
    options: IGenOptions = {
      skipValidation: false,
      consolidateUnions: true,
      showParentInSelections: false,
    },
    // prompt: Prompt
  ): Promise<OasGen> {
    if (!fs.existsSync(sourceFile)) {
      throw new Error('Source not found: ' + sourceFile);
    }

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
    return new OasGen(parser, options);
  }

  public parser: Oas;
  // public prompt: Prompt;
  public context?: OasContext;
  public paths: Map<string, IType> = new Map();
  public options: GenerateOptions;
  private collector: TypesCollector;

  constructor(parser: Oas, options: GenerateOptions) {
    this.parser = parser;
    this.options = options;
    this.collector = new TypesCollector(this);
  }

  public title(): string {
    return this.parser.getDefinition().info.title;
  }

  public version(): string {
    return this.parser.getDefinition().info.version;
  }

  public expanded(paths: string[]): string[] {
    this.collector.collect(paths);
    return this.collector.expanded;
  }

  public getTypes(paths: string[]): Map<string, IType> {
    // make sure we pass the latest options to our context for the generation
    const context = this.getContext();
    context.generateOptions = this.options;

    this.collector.collect(paths);

    return this.collector.types;
  }

  public generateSchema(paths: string[]): string {
    // make sure we pass the latest options to our context for the generation
    const context = this.getContext();
    context.reset();
    context.generateOptions = this.options;

    this.collector.collect(paths);

    const writer: Writer = new Writer(this);
    this.selections = writer.generateWith(this.collector.types, this.collector.expanded);

    return writer.flush();
  }

  public async visit(): Promise<void> {
    const parser = this.parser;
    const context = this.getContext();

    const paths = parser.getPaths();
    const filtered = Object.entries(paths)
      .filter(([_key, pathItem]) => this.isSupported(pathItem))
      .sort((a, b) => a[0].localeCompare(b[0], undefined, { sensitivity: 'base' }));

    const collected = new Map<string, IType>();
    for (const [key, pathItem] of filtered) {
      this.visitPath(context, key, pathItem).forEach((type) => collected.set(type.id, type));
    }

    this.paths = collected;
  }

  public visitSync(): void {
    if (this.visited) return;

    const parser = this.parser;
    const context = this.getContext();

    const paths = parser.getPaths();
    const filtered = Object.entries(paths)
      .filter(([_key, pathItem]) => this.isSupported(pathItem))
      .sort((a, b) => a[0].localeCompare(b[0], undefined, { sensitivity: 'base' }));

    const collected = new Map<string, IType>();
    for (const [key, pathItem] of filtered) {
      this.visitPath(context, key, pathItem).forEach((type) => collected.set(type.id, type));
    }

    this.paths = collected;
  }

  private isSupported(pathItem: Record<HttpMethods, Webhook | Operation>) {
    return pathItem.get || pathItem.post || pathItem.put || pathItem.delete || pathItem.patch;
  }

  public getContext(): OasContext {
    if (!this.context) {
      this.context = new OasContext(this.parser, this.options);
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

  /** this seems a bit buggy at the moment, needs more testing **/
  public findPath(path: string): IType | boolean {
    let collection = Array.from(this.paths.values());
    let current: IType | undefined;
    let last: IType | undefined;

    let i = 0;
    const parts = path.split('>');
    do {
      const part = parts[i].replace(/#\/c\/s/g, '#/components/schemas');
      current = collection.find((t) => t.id === part);
      if (!current) {
        throw new Error('Could not find type: ' + part + ' from ' + path + ', last: ' + last?.pathToRoot());
      }

      // make sure we expand it before we move on to the next part
      this.expand(current);
      last = current;

      collection = Array.from(current!.children.values()) || Array.from(current!.props.values()) || [];

      i++;
    } while (i < parts.length);

    return current;
  }

  public writer(): Writer {
    return new Writer(this);
  }

  // private methods
  private visitGet(context: OasContext, name: string, op: Operation): IType {
    trace(context, '-> [visitGet]', `in:  [${name}] id: ${op.getOperationId()}`);
    const result = Factory.createGet(name, op);
    trace(context, '<- [visitGet]', `out: [${name}] id: ${op.getOperationId()}`);
    return result;
  }

  private visitPost(context: OasContext, name: string, op: Operation): IType {
    trace(context, '-> [visitPost]', `in:  [${name}] id: ${op.getOperationId()}`);
    const result = Factory.fromPost(name, op);
    trace(context, '<- [visitPost]', `out: [${name}] id: ${op.getOperationId()}`);
    return result;
  }

  private visitPut(context: OasContext, name: string, op: Operation): IType {
    trace(context, '-> [visitPut]', `in:  [${name}] id: ${op.getOperationId()}`);
    const result = Factory.fromPut(name, op);
    trace(context, '<- [visitPut]', `out: [${name}] id: ${op.getOperationId()}`);
    return result;
  }

  private visitPatch(context: OasContext, name: string, op: Operation): IType {
    trace(context, '-> [visitPatch]', `in:  [${name}] id: ${op.getOperationId()}`);
    const result = Factory.fromPatch(name, op);
    trace(context, '<- [visitPatch]', `out: [${name}] id: ${op.getOperationId()}`);
    return result;
  }

  private visitDelete(context: OasContext, name: string, op: Operation): IType {
    trace(context, '-> [visitDelete]', `in:  [${name}] id: ${op.getOperationId()}`);
    const result = Factory.fromDelete(name, op);
    trace(context, '<- [visitDelete]', `out: [${name}] id: ${op.getOperationId()}`);
    return result;
  }

  private visitPath(context: OasContext, name: string, pathItem: Record<string, Webhook | Operation>): IType[] {
    const paths: IType[] = [];
    if (pathItem.get !== undefined) {
      if ((pathItem.get as Webhook | Operation)?.constructor.name === 'Webhook') {
        throw new Error('Webhook not supported');
      }
      paths.push(this.visitGet(context, name, pathItem.get as Webhook | Operation));
    }

    if (pathItem.post !== undefined) {
      paths.push(this.visitPost(context, name, pathItem.post));
    }

    if (pathItem.put !== undefined) {
      paths.push(this.visitPut(context, name, pathItem.put));
    }

    if (pathItem.patch !== undefined) {
      paths.push(this.visitPatch(context, name, pathItem.patch));
    }

    if (pathItem.delete !== undefined) {
      paths.push(this.visitDelete(context, name, pathItem.delete));
    }

    return paths;
  }
}
