import Gen from "./parser/gen";
import { Command } from 'commander';

import {typesPrompt} from "./prompts/prompt";
import Writer from "./parser/io/writer";

const originalConsole = {
  log: console.log,
};


async function main(sourceFile: string): Promise<void> {
  console.log = () => {};

  const gen = await Gen.fromFile(sourceFile);
  await gen.visit();

  let types = Array.from(gen.paths!.values());
  const paths = await typesPrompt({
    message: "Navigate spec and choose types",
    types,
    context: gen.context!,
    expandFn: type => {
      if (!type) return types; // top level paths
      return gen.expand(type)
    }
  });

  console.info('selected :=', paths);

  const writer: Writer = new Writer(gen);
  writer.generate(paths);
  console.info(writer.flush());
}

const program = new Command();
program
  .version('0.0.1')
  .argument('<source>', 'source spec (yaml or json)')
  .parse(process.argv);

const source = program.args[0];
main(source).then(() => console.log('done'));