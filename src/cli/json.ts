import fs from 'fs';
import { Walker } from '../json/walker/walker';
import { ConnectorWriter, StringWriter } from '../json/io/writer';

// mute console.log
console.log = () => {};

function walkSourceFile(source: string): void {
  const writer = new StringWriter();
  const fileContent = fs.readFileSync(source, 'utf-8');

  const walker = Walker.fromReader(fileContent);
  ConnectorWriter.write(walker, writer);

  console.info(writer.flush());
}

async function main() {
  walkSourceFile(
    '/Users/fernando/Development/Apollo/connectors/projects/JsonToConnector/src/test/resources/preferences/user/50.json',
  );
}

main().then(() => console.log('done'));
