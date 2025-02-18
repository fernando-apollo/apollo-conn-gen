import fs from 'fs'
import Gen from "../parser/gen";
import Writer from "../parser/io/writer";
import * as path from "path";
import * as os from "os";
import {execSync, spawnSync} from 'child_process';

const base = "/Users/fernando/Development/Apollo/connectors/projects/OasToConnector/apollo-connector-gen/src/test/resources/"

test('test minimal petstore', async () => {
  expect(fs.existsSync(`${base}/petstore.yaml`)).toBeTruthy();

  let file = fs.readFileSync(`${base}/petstore.yaml`);
  expect(file).toBeDefined();

  const paths = [
    'get:/pet/{petId}>res:r>ref:#/c/s/Pet>obj:#/c/s/Pet>prop:scalar:id',
    'get:/pet/{petId}>res:r>ref:#/c/s/Pet>obj:#/c/s/Pet>prop:scalar:name',
    'get:/pet/{petId}>res:r>ref:#/c/s/Pet>obj:#/c/s/Pet>prop:ref:#category>obj:#/c/s/Category>prop:scalar:name'
  ]

  const gen = await Gen.fromFile(`${base}/petstore.yaml`);
  await gen.visit();

  expect(gen.paths).toBeDefined();
  expect(gen.paths.size).toBe(8);

  const writer: Writer = new Writer(gen);
  writer.generate(paths);
  const schema = writer.flush();
  expect(schema).toBeDefined();

  const schemaFile = path.join(os.tmpdir(), 'test_001_testMinimalPetstore.graphql');
  fs.writeFileSync(schemaFile, schema, { encoding: 'utf-8', flag: 'w' });

  const [result, output] = compose(schemaFile);
  expect(result).toBeTruthy();
  expect(output).toBeUndefined();
});

test('test minimal petstore 02', async () => {
  expect(fs.existsSync(`${base}/petstore.yaml`)).toBeTruthy();

  let file = fs.readFileSync(`${base}/petstore.yaml`);
  expect(file).toBeDefined();

  const paths = [
    'get:/pet/{petId}>res:r>ref:#/c/s/Pet>obj:#/c/s/Pet>prop:array:#tags>prop:ref:#TagsItem>obj:#/c/s/Tag>prop:scalar:id',
    'get:/pet/{petId}>res:r>ref:#/c/s/Pet>obj:#/c/s/Pet>prop:array:#tags>prop:ref:#TagsItem>obj:#/c/s/Tag>prop:scalar:name',
    'get:/pet/{petId}>res:r>ref:#/c/s/Pet>obj:#/c/s/Pet>prop:ref:#category>obj:#/c/s/Category>prop:scalar:id',
    'get:/pet/{petId}>res:r>ref:#/c/s/Pet>obj:#/c/s/Pet>prop:ref:#category>obj:#/c/s/Category>prop:scalar:name',
    'get:/pet/{petId}>res:r>ref:#/c/s/Pet>obj:#/c/s/Pet>prop:scalar:id',
    'get:/pet/{petId}>res:r>ref:#/c/s/Pet>obj:#/c/s/Pet>prop:scalar:name',
    'get:/pet/{petId}>res:r>ref:#/c/s/Pet>obj:#/c/s/Pet>prop:array:#photoUrls>prop:scalar:PhotoUrlsItem',
    'get:/pet/{petId}>res:r>ref:#/c/s/Pet>obj:#/c/s/Pet>prop:scalar:status'
  ]

  const gen = await Gen.fromFile(`${base}/petstore.yaml`);
  await gen.visit();

  expect(gen.paths).toBeDefined();
  expect(gen.paths.size).toBe(8);

  const writer: Writer = new Writer(gen);
  writer.generate(paths);
  const schema = writer.flush();
  expect(schema).toBeDefined();

  const schemaFile = path.join(os.tmpdir(), 'test_001_testMinimalPetstore.graphql');
  fs.writeFileSync(schemaFile, schema, { encoding: 'utf-8', flag: 'w' });

  const [result, output] = compose(schemaFile);
  expect(result).toBeTruthy();
  expect(output).toBeUndefined();
});


/// rover checks
function isRoverAvailable(command: string): [boolean, string?] {
  const cmd = os.platform() === 'win32' ? 'where' : 'which';
  const result = spawnSync(cmd, [command], { encoding: 'utf8' });

  return [result.status === 0, result.stdout.toString().trim()];
}

function compose(schemaPath: string){
  let rover: [boolean, (string | undefined)?] = isRoverAvailable('rover');
  if (!rover[0]) {
    throw new Error("Rover is not available");
  }

  const supergraphFile = path.join(os.tmpdir(), 'supergraph.yaml');
  const content: string = `
federation_version: =2.10.0-preview.3
subgraphs:
  test_spec:
    routing_url: http://localhost # this value is ignored
    schema:
      file: ${schemaPath} # path to the schema file`;

  fs.writeFileSync(supergraphFile, content, { encoding: 'utf-8', flag: 'w' });

  const cmd = `${rover[1]} supergraph compose --config ${supergraphFile} --elv2-license accept`

  let output;
  try {
    output = execSync(cmd, {stdio: 'inherit'});
    return [true, undefined];
  }
  catch (error) {
    return [false, output?.toString()];
  }
}