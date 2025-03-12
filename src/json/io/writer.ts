import { IWriter } from './types';
import { Walker } from '../walker/walker';

export class StringWriter implements IWriter {
  builder: string[] = [];

  write(text: string): void {
    this.builder.push(text);
  }

  flush(): string {
    return this.builder.join('');
  }

  clear(): void {
    this.builder = [];
  }
}

export class ConnectorWriter {
  public static write(walker: Walker, writer: IWriter): void {
    this.writeConnector(writer);
    walker.writeTypes(writer);
    this.writeQuery(walker, writer);
  }

  private static writeConnector(writer: IWriter): void {
    writer.write(`extend schema
  @link(url: "https://specs.apollo.dev/federation/v2.10", import: ["@key"])
  @link(
    url: "https://specs.apollo.dev/connect/v0.1"
    import: ["@connect", "@source"]
  )
  @source(name: "api", http: { baseURL: "http://localhost:4010" })
  
`);
  }

  private static writeQuery(walker: Walker, writer: IWriter): void {
    writer.write(
      '\n' +
        `type Query {
  root: Root
    @connect(
      source: "api"
      http: { GET: "/test" }
      selection: """`,
    );

    walker.writeSelection(writer);

    writer.write(`"""
)}
`);
  }
}
