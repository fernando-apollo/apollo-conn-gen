import Gen from "./parser/gen";
import {Command} from 'commander';

import {typesPrompt} from "./prompts/prompt";
import Writer from "./parser/io/writer";
import Ref from "./parser/nodes/ref";
import {IType, Type} from "./parser/nodes/type";
import Composed from "./parser/nodes/comp";
import PropRef from "./parser/nodes/props/prop_ref";
import Union from "./parser/nodes/union";

const originalConsole = {
  log: console.log,
};


async function main(sourceFile: string): Promise<void> {
  console.log = () => {
  };

  const gen = await Gen.fromFile(sourceFile);
  await gen.visit();

  let types = Array.from(gen.paths!.values());

  const expandType = (type?: IType) => {
    if (!type) return types;

    let result: IType[] = [];

    if (type instanceof Composed || type instanceof Union) {
      // make sure we gather all the props
      (type as any).consolidate([])

      result = Array.from(type.props.values());
    }
    else {
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

  const paths = await typesPrompt({
    message: "Navigate spec and choose types.ts",
    types,
    context: gen.context!,
    expandFn: expandType
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