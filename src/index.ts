import Gen from "./parser/gen";
import fileSelector from 'inquirer-file-selector'

import {typesPrompt} from "./prompts/prompt";

const originalConsole = {
  log: console.log,
};


async function main(): Promise<void> {
  console.log = () => {};

  const baseURL =
    '/Users/fernando/Development/Apollo/connectors/projects/OasToConnector/apollo-connector-gen/src/test/resources/';
  const sourceFile = `${baseURL}/petstore.yaml`;

  const generator = await Gen.fromFile(sourceFile);
  await generator.visit();

  let types = Array.from(generator.paths!.values());
  const paths = await typesPrompt({
    message: "Navigate spec and choose types",
    types,
    expandFn: type => {
      if (!type) return types; // top level paths
      return generator.expand(type)
    }
  });

  console.info('selected :=', paths);
}

main().then(_r => console.log('done'));