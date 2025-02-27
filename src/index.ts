import Gen from "./parser/gen";
import {Command} from 'commander';

import {typesPrompt} from "./prompts/prompt";
import Writer from "./parser/io/writer";
import Ref from "./parser/nodes/ref";
import {IType, Type} from "./parser/nodes/type";
import Composed from "./parser/nodes/comp";
import Union from "./parser/nodes/union";
import figures from "@inquirer/figures";

const originalConsole = {
  log: console.log,
};

async function main(sourceFile: string, opts: any): Promise<void> {
  console.log = () => {
  };

  const gen = await Gen.fromFile(sourceFile, opts);
  await gen.visit();

  let types = Array.from(gen.paths!.values());

  const expandType = (type?: IType) => {
    if (!type) return types;

    let result: IType[] = [];

    if (type instanceof Composed || type instanceof Union) {
      // make sure we gather all the props
      (type as any).consolidate([])

      result = Array.from(type.props.values());
    } else {
      // top level paths
      result = gen.expand(type);

      if (result.length === 1) { // we are checking for a ref so we can go straight to where its pointing
        const child = result[0];

        if (!(child as Type).visited)
          child.visit(gen.context!);

        if (child instanceof Ref) {
          result = [child.refType!];
        }
      }
    }

    return result
  }

  let pathSet = Array.from(gen.paths.values());

  if (opts.grep !== '*') {
    const regex = new RegExp(opts.grep, 'ig');
    pathSet = pathSet.filter(p => regex.test(p.path()))
  }

  if (opts.listPaths) {
    pathSet.forEach(path => console.info(path.path()))
    return;
  }

  let paths: Array<string> = []
  if (opts.skipSelection) {
    paths = pathSet.map(p => p.path() + ">**")
  } else {
    paths = await typesPrompt({
      message: "Navigate spec and select the fields to use in the connector",
      types: pathSet,
      context: gen.context!,
      expandFn: expandType,
      pageSize: parseInt(opts.pageSize)
    });
  }

  console.info('selected :=', paths);

  const writer: Writer = new Writer(gen);
  writer.generate(paths);
  console.info(writer.flush());
}

const program = new Command();
program
  .version('0.0.1')
  .argument('<source>', 'source spec (yaml or json)')
  .option('-i --skip-validation', 'Skip validation step', false)
  .option('-n --skip-selection', 'Generate all [filtered] paths without prompting for a selection', false)
  .option('-l --list-paths', 'Only list the paths that can be generated', false)
  .option('-g --grep <regex>', 'Filter the list of paths with the passed expression', "*")
  .option('-p --page-size <num>', 'Number of rows to display in selection mode', "10")
  .parse(process.argv);

const source = program.args[0];
main(source, program.opts()).then(() => console.log('done'));