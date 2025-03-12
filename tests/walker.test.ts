import * as os from 'os';
import * as path from 'path';
import fs from 'fs';
import { execSync, spawnSync } from 'child_process';
import _ from 'lodash';
import { ConnectorWriter, StringWriter } from '../src/json/io/writer';
import { Walker } from '../src/json/walker/walker';
import { Context } from '../src/json/walker/context';
import { Type } from '../src/json/walker/types/type';

interface ITestOptions {
  shouldFail: boolean;
  outputContains?: string;
}

console.log = () => {};
console.warn = () => {};

const writer = new StringWriter();
const base =
  '/Users/fernando/Development/Apollo/connectors/projects/JsonToConnector/src/test/resources/';

afterEach(() => {
  writer.clear();
});

describe('Walker Test Suite', () => {
  it('should construct Walker from JSON string and store types in context', () => {
    const json = `{
      "name": "Test User",
      "age": 25,
      "address": {
        "street": "Main St",
        "city": "Anytown"
      }
    }`;

    const walker = Walker.fromReader(json);
    const context: Context = walker.getContext();
    const types: Type[] = context.getTypes();

    ConnectorWriter.write(walker, writer);
    writer.clear();

    expect(types.length).toBeGreaterThan(0);
  });

  it('should construct Walker from JSON file and store types in context', async () => {
    await run('test/merge/a.json');
  });

  it('should read and output a single file', async () => {
    await run('preferences/user/50.json');
  });

  it('should read all the json files and combine the output into one', async () => {
    await run('live-scores/all');
  });

  it('stats/fixtures/championship', async () => {
    await run('stats/fixtures/championship');
  });

  it('stats/leagues', async () => {
    await run('stats/leagues');
  });

  it('stats/line-ups', async () => {
    await run('stats/line-ups');
  });

  it('stats/results/scottish-premiership', async () => {
    await run('stats/results/scottish-premiership');
  });

  it('stats/tables/championship', async () => {
    await run('stats/tables/championship');
  });

  it('stats/tables/not-found.json', async () => {
    await run('stats/tables/not-found.json');
  });

  it('fronts', async () => {
    await run('fronts');
  });

  it('articles/search.json', async () => {
    await run('articles/search.json');
  });

  it('articles/clockwatch', async () => {
    const output = await run('articles/clockwatch', { shouldFail: true });
    expect(output).toBeDefined()
    expect(output!.includes("SELECTED_FIELD_NOT_FOUND")).toBeTruthy()
  });

  it('test/merge', async () => {
    await run('test/merge');
  });

  it('articles/blog', async () => {
    await run('articles/blog', {
      shouldFail: true,
      outputContains: 'SELECTED_FIELD_NOT_FOUND',
    });
  });

  it('articles/article', async () => {
    await run('articles/article', {
      shouldFail: true,
      outputContains: 'SELECTED_FIELD_NOT_FOUND',
    });
  });

  it('articles/article/2023_dec_01_premier-league-10-things-to-look-out-for-this-weekend', async () => {
    await run(
      'articles/article/2023_dec_01_premier-league-10-things-to-look-out-for-this-weekend.json', {
        shouldFail: true,
        outputContains: 'SELECTED_FIELD_NOT_FOUND',
      });
  });

  it('live-scores/all/2023-12-23_15_00.json', async () => {
    await run('live-scores/all/2023-12-23_15_00.json');
  });
});

async function run(
  fileOrFolder: string,
  options: ITestOptions = { shouldFail: false, outputContains: undefined }
): Promise<string | undefined> {
  const fileOrFolderPath: string = `${base}/${fileOrFolder}`;

  expect(fs.existsSync(fileOrFolderPath)).toBeTruthy();

  let walker: Walker;

  const stats = fs.statSync(fileOrFolderPath);
  if (stats.isDirectory()) {
    walker = Walker.new();

    const sources = fs
      .readdirSync(fileOrFolderPath)
      .filter((name) => name.toLowerCase().endsWith('.json'));

    for (const source of sources) {
      const fullPath = path.join(fileOrFolderPath, source);
      const json = fs.readFileSync(fullPath, 'utf-8');
      expect(json).toBeDefined();

      walker.walkJson(json);
    }
  } else {
    const json = fs.readFileSync(fileOrFolderPath, 'utf-8');
    expect(json).toBeDefined();

    walker = Walker.fromReader(json);
  }

  const context: Context = walker.getContext();

  const types: Type[] = context.getTypes();
  expect(types.length).toBeGreaterThan(0);

  ConnectorWriter.write(walker, writer);

  const schema = writer.flush();
  expect(schema).toBeDefined();

  const schemaFile = path.join(
    os.tmpdir(),
    fileOrFolder.replace(/\.yaml|\.json|\.yml/, '') + '.graphql'
  );

  // Ensure the directory exists
  // fs.mkdirSync(path.dirname(schemaFile), { recursive: true });
  const parentFolder = path.dirname(schemaFile);
  if (!fs.existsSync(parentFolder)) {
    fs.mkdirSync(parentFolder, { recursive: true });
  }

  if (fs.existsSync(schemaFile)) {
    fs.unlinkSync(schemaFile);
  }

  fs.writeFileSync(schemaFile, schema, { encoding: 'utf-8', flag: 'w' });

  const [result, output] = compose(schemaFile);

  if (options.shouldFail) {
    expect(result).toBeFalsy();
    expect(output).toBeDefined();
    return output as string | undefined;
  } else {
    expect(output).toBeUndefined();
    expect(result).toBeTruthy();
  }

  writer.clear();
}

/// rover checks
function isRoverAvailable(command: string): [boolean, string?] {
  const cmd = os.platform() === 'win32' ? 'where' : 'which';
  const result = spawnSync(cmd, [command], { encoding: 'utf8' });

  return [result.status === 0, result.stdout.toString().trim()];
}

function compose(schemaPath: string) {
  console.info('schemaPath', schemaPath);

  const rover: [boolean, (string | undefined)?] = isRoverAvailable('rover');
  if (!rover[0]) {
    throw new Error('Rover is not available');
  }

  const supergraphFile = path.join(os.tmpdir(), 'supergraph.yaml');
  const content: string = `
federation_version: =2.10.0
subgraphs:
  test_spec:
    routing_url: http://localhost # this value is ignored
    schema:
      file: ${schemaPath} # path to the schema file`;

  fs.writeFileSync(supergraphFile, content, { encoding: 'utf-8', flag: 'w' });

  const cmd = `${rover[1]} supergraph compose --config ${supergraphFile} --elv2-license accept`;

  let output;
  try {
    output = execSync(cmd, { stdio: 'pipe' });
    return [true, undefined];
  } catch (error) {
    return [false, _.get(error, 'message')];
  }
}
