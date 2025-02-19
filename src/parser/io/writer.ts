import Gen from "../gen";
import Context from "../context";
import {IType} from "../nodes/type";
import Naming from "../utils/naming";
import Oas from "oas";
import _ from "lodash";
import Get from "../nodes/get";
import Param from "../nodes/param/param";
import Prop from "../nodes/props/prop";
import Obj from "../nodes/obj";
import Union from "../nodes/union";
import Composed from "../nodes/comp";
import CircularRef from "../nodes/circular_ref";

export default class Writer {
  buffer: string[];

  constructor(public generator: Gen) {
    this.buffer = []
  }

  write(input: string): Writer {
    this.buffer.push(input);
    return this;
  }

  append(input: string): Writer {
    this.buffer.push(input);
    return this;
  }

  flush(): string {
    let result = this.buffer.join('');
    console.log(result);
    return result;
  }

  public writeSchema(writer: Writer, pending: Map<string, IType>, selection: string[]): void {
    const context = this.generator.context!;
    const generatedSet = context.generatedSet;
    generatedSet.clear();

    this.writeDirectives(writer);
    this.writeJSONScalar(writer);

    pending.forEach((type: IType, _key: string) => {
      if (!generatedSet.has(type.path())) {
        type.generate(context, this, selection);
        generatedSet.add(type.path());
      }
    });

    // TODO: Pending
    // const counter = new RefCounter(this.context);
    // counter.addAll(this.collected);

    // const refs = counter.getCount();
    // this.printRefs(refs);

    // for (const type of this.context.types.values()) {
    //   if (counter.getCount().has(type.name)) {
    //     await type.generate(this.context, writer);
    //     generatedSet.add(type.name);
    //   }
    // }

    this.writeQuery(context, writer, this.generator.paths, selection);
    writer.flush();
  }

  private writeJSONScalar(writer: Writer): void {
    writer.write('\nscalar JSON\n\n');
  }

  private writeQuery(context: Context, writer: Writer, collected: Map<string, IType>, selection: string[]): void {
    writer.write('type Query {\n');

    let paths = Array.from(collected.values())
      .filter(path => selection.find(s => s.startsWith(path.path())));

    for (const path of paths) {
      path.generate(context, writer, []);
      this.writeConnector(context, writer, path, selection);
      context.generatedSet.add(path.name);
    }

    writer.write('}\n\n');
  }

  private writeConnector(context: Context, writer: Writer, type: IType, selection: string[]): void {
    let indent = 0;
    const get = type as Get; // assume type is GetOp
    let spacing = ' '.repeat(indent + 4);
    writer.append(spacing).append('@connect(\n');

    const request = this.buildRequestMethodAndArgs(get);
    spacing = ' '.repeat(indent + 6);
    writer
      .append(spacing)
      .append('source: "api"\n')
      .append(spacing)
      .append('http: ' + request + '\n')
      .append(spacing)
      .append('selection: """\n');

    if (get.resultType) {
      this.writeSelection(context, writer, get.resultType, selection);
    }

    writer.append(spacing).append('"""\n');
    spacing = ' '.repeat(indent + 4);
    writer.append(spacing).append(')\n');
  }

  private buildRequestMethodAndArgs(get: Get): string {
    let builder = '';

    builder += '"' + get.operation.path.replace(/\{([a-zA-Z0-9]+)\}/g, '{$args.$1}');

    if (get.params.length > 0) {
      const params = get.params
        .filter((p: Param) => {
          return p.required && p.parameter.in && p.parameter.in.toLowerCase() === 'query';
        });

      if (params.length > 0) {
        builder += '?' + params
          .map((p: Param) => `${p.name}={$args.${Naming.genParamName(p.name)}}`)
          .join('&');
      }
      const headers = get.params
        .filter((p: Param) => p.parameter.in && p.parameter.in.toLowerCase() === 'header')
        .map(p => p.parameter);

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

  private writeSelection(context: Context, writer: Writer, type: IType, selection: string[]): void {
    context.indent = 6;
    type.select(context, writer, selection);
  }

  private writeDirectives(writer: Writer): void {
    const api: Oas = this.generator.parser;
    const host = this.getServerUrl(api.getDefinition().servers?.[0]);
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

  private getServerUrl(server: any): string {
    if (!server) return 'http://localhost:4010';
    let url: string = server.url;
    if (server.variables) {
      for (const key in server.variables) {
        url = url.replace('{' + key + '}', server.variables[key].default);
      }
    }
    return url;
  }

  generate(selection: string[]) {
    const operations = Array.from(this.generator.paths.values());
    const pending: Map<string, IType> = new Map();

    for (const path of selection) {
      const parts = Writer.progressiveSplits(path);

      let found, parent: IType | boolean = false;
      for (let i = 0; i < parts.length; i++) {
        console.log("finding ....", parts[i]);
        if (i === 0)
          found = this.generator.find(parts[i]);
        else
          found = (found as IType).find(parts[i], operations);

        if (!found) {
          throw new Error('Could not find type for path: ' + path + ", in: " + (parent as IType).id);
        }

        this.generator.expand(found as IType);
        parent = found;
      }

      if (found) {
        let parentType = Writer.findNonPropParent(found as IType);

        if (!pending.has(parentType.id)) {
          pending.set(parentType.id, parentType);
        }

        parentType.ancestors()
          .filter(t => !pending.has(t.id) && this.isContainer(t))
          .forEach(dep => {
            // TODO: potential merge needed?
            pending.set(dep.id, dep);
          })
      }
    }

    if (!_.isEmpty(pending)) {
      this.writeSchema(this, pending, selection);
    }
  }

  static findNonPropParent(type: IType) {
    let parent = type;
    while (parent instanceof Prop) {
      parent = parent.parent!;
    }
    return parent;
  }

  static progressiveSplits(input: string): string[] {
    const parts = input.split(">");
    const results: string[] = [];
    for (let i = 1; i <= parts.length; i++) {
      results.push(parts.slice(0, i).join(">"));
    }
    return results;
  }

  private isContainer(type: IType) {
    return (
      type instanceof Obj ||
      type instanceof Union ||
      type instanceof Composed ||
      type instanceof CircularRef
    )
  }
}
