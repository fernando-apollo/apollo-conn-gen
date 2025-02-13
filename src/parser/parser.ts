import Oas from 'oas';
import {Operation, Webhook, Callback} from 'oas/operation';
import {OASDocument, OperationObject} from 'oas/types';
import {OpenAPI, OpenAPIV3} from 'openapi-types';
import OASNormalize from 'oas-normalize';

import fs from 'fs';
import Context from './context';
import {IType} from './nodes/type';
import {trace} from '../log/trace';
import Prompt from './prompt';
import Writer from './io/writer';
import Factory from './nodes/factory';
import Naming from './utils/naming';
import _ from "lodash";

export default class ConnectorGen {
  public parser: Oas;
  public prompt: Prompt;
  public context?: Context;
  public collected: Map<string, IType> = new Map();

  constructor(parser: Oas, prompt: Prompt) {
    this.parser = parser;
    this.prompt = prompt;
  }

  public static async fromFile(
    sourceFile: string,
    prompt: Prompt
  ): Promise<ConnectorGen> {
    if (!fs.existsSync(sourceFile)) {
      throw new Error('Source not found: ' + sourceFile);
    }

    // const options = { resolve: true, resolveCombinators: false };
    // const parser = new OpenAPIV3Parser().read(source, null, options);
    const normalizer: OASNormalize = new OASNormalize(sourceFile, {
      enablePaths: true,
    });

    const loaded: Record<string, unknown> = await normalizer.load();
    console.log('loaded file');

    const normalised: OpenAPI.Document = await normalizer.bundle();
    console.log('loaded bundle');

    const validated: boolean = await normalizer.validate();
    if (!validated) {
      throw new Error('Could not validate source file');
    }

    console.log('validated', validated);

    const json = await normalizer.convert();
    console.log('converted');

    const parser: Oas = new Oas(json as OASDocument);
    return new ConnectorGen(parser, prompt);
  }

  public async visit(): Promise<void> {
    const parser = this.parser;
    const context = this.getContext();

    const paths = parser.getPaths();
    const filtered = Object.entries(paths)
      .filter(([key, pathItem]) => pathItem.get !== undefined)
      .sort((a, b) =>
        a[0].localeCompare(b[0], undefined, {sensitivity: 'base'})
      );

    const collected = new Map<string, IType>();
    for (const [key, pathItem] of filtered) {
      const result = this.visitPath(context, key, pathItem);
      collected.set(key, result);
    }

    this.collected = collected;
  }

  public getContext(): Context {
    if (!this.context) {
      this.context = new Context(this.parser, this.prompt);
    }
    return this.context;
  }

  // TODO: implement this
  // public async writeSchema(writer: Writer): Promise<void> {
  //   const generatedSet = this.context!.generatedSet;
  //   generatedSet.clear();
  //
  //   this.writeDirectives(writer);
  //   this.writeJSONScalar(writer);
  //
  //   const counter = new RefCounter(this.context);
  //   counter.addAll(this.collected);
  //
  //   const refs = counter.getCount();
  //   this.printRefs(refs);
  //
  //   for (const type of this.context.types.values()) {
  //     if (counter.getCount().has(type.name)) {
  //       await type.generate(this.context, writer);
  //       generatedSet.add(type.name);
  //     }
  //   }
  //
  //   await this.writeQuery(this.context, writer, this.collected!);
  //   writer.flush();
  // }

  private writeJSONScalar(writer: Writer): void {
    writer.write('\nscalar JSON\n\n');
  }

  private async writeQuery(
    context: Context,
    writer: Writer,
    collected: Set<IType>
  ): Promise<void> {
    writer.write('type Query {\n');

    for (const type of collected) {
      await type.generate(context, writer);
      await this.writeConnector(context, writer, type);
      context.generatedSet.add(type.name);
    }

    writer.write('}\n\n');
  }

  private async writeConnector(
    context: Context,
    writer: Writer,
    type: IType
  ): Promise<void> {
    let indent = 0;
    const get = type as any; // assume type is GetOp
    let spacing = ' '.repeat(indent + 4);
    writer.append(spacing).append('@connect(\n');

    const request = ConnectorGen.buildRequestMethodAndArgs(get);
    spacing = ' '.repeat(indent + 6);
    writer
      .append(spacing)
      .append('source: "api"\n')
      .append(spacing)
      .append('http: ' + request + '\n')
      .append(spacing)
      .append('selection: """\n');

    if (get.getResultType()) {
      // TODO: implement this
      // await this.writeSelection(context, writer, get.getResultType());
    }

    writer.append(spacing).append('"""\n');
    spacing = ' '.repeat(indent + 4);
    writer.append(spacing).append(')\n');
  }

  private static buildRequestMethodAndArgs(get: any): string {
    let builder = '';
    builder +=
      '"' + get.getOriginalPath().replace(/\{([a-zA-Z0-9]+)\}/g, '{$args.$1}');

    if (get.getParameters().length > 0) {
      const queries = get
        .getGet()
        .parameters.filter(
          (p: any) =>
            p.required === true && p.in && p.in.toLowerCase() === 'query'
        );
      if (queries.length > 0) {
        const queryString = queries
          .map((p: any) => `${p.name}={$args.${Naming.genParamName(p.name)}}`)
          .join('&');
        builder += '?' + queryString;
      }
      const headers = get
        .getGet()
        .parameters.filter((p: any) => p.in && p.in.toLowerCase() === 'header');

      builder += '"\n';

      if (headers.length > 0) {
        let spacing = ' '.repeat(6);
        builder += spacing + 'headers: [\n';
        spacing = ' '.repeat(8);

        for (const p of headers) {
          let value: string | null = null;
          if (p.example != null) value = p.example.toString();
          if (p.examples && Object.keys(p.examples).length > 0)
            value = Object.keys(p.examples).join(',');
          if (value == null) value = '<placeholder>';
          builder += spacing + `{ name: "${p.name}", value: "${value}" }\n`;
        }

        spacing = ' '.repeat(6);
        builder += spacing + ']';
      }
    } else {
      builder += '"';
    }
    return `{ GET: ${builder} }`;
  }

  // TODO: implement this
  // private async writeSelection(
  //   context: Context,
  //   writer: Writer,
  //   type: IType
  // ): Promise<void> {
  //   context.indent = 6;
  //   await type.select(context, writer);
  // }

  private visitGet(context: Context, name: string, op: Operation): IType {
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

  private writeDirectives(writer: Writer): void {
    const api = this.parser;
    const host = ConnectorGen.getServerUrl(api.getDefinition().servers?.[0]);
    writer
      .append('extend schema\n')
      .append(
        '  @link(url: "https://specs.apollo.dev/federation/v2.10", import: ["@key"])\n'
      )
      .append('  @link(\n')
      .append('    url: "https://specs.apollo.dev/connect/v0.1"\n')
      .append('    import: ["@connect", "@source"]\n')
      .append('  )\n')
      .append('  @source(name: "api", http: { baseURL: "')
      .append(host)
      .append('" })\n\n');
  }

  private static getServerUrl(server: any): string {
    if (!server) return 'http://localhost:4010';
    let url: string = server.url;
    if (server.variables) {
      for (const key in server.variables) {
        url = url.replace('{' + key + '}', server.variables[key].default);
      }
    }
    return url;
  }

  expand(type: IType): IType[] {
    const ctx = this.getContext();
    const path = type.path();

    trace(ctx, '-> [expand]', `in: path: ${path}`);
    type.visit(ctx);
    trace(ctx, '<- [expand]', `out: path: ${path}`);

    return type.children;
  }

  private visitPath(
    context: Context,
    name: string,
    pathItem: Record<string, Webhook | Operation>
  ): IType {
    let operation = pathItem.get;
    if (operation instanceof Webhook) throw new Error('Webhook not supported');

    trace(
      context,
      '-> [visitPath]',
      `in:  [${name}] id: ${operation.getOperationId()}`
    );
    const type = this.visitGet(context, name, operation);
    trace(
      context,
      '<- [visitPath]',
      `out: [${name}] id: ${operation.getOperationId()}`
    );
    return type;
  }
}
