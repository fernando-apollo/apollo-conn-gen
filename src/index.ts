import {IType} from "./parser/nodes/type";
import ConnectorGen from "./parser/parser";
import Prompt from "./parser/prompt";

import {expand, select, Separator} from '@inquirer/prompts';
import _ from "lodash";

async function main(): Promise<void> {
  const baseURL =
    '/Users/fernando/Documents/Opportunities/Vodafone/tmf-apis/tmf-specs';
  const sourceFile = `${baseURL}/TMF637-ProductInventory-v5.0.0.oas.yaml`;

  const generator = await ConnectorGen.fromFile(sourceFile, new Prompt());
  await generator.visit();

  const paths = Array.from(generator.collected!.keys());
  const path: string = await select({
    message: 'Select a path',
    choices: paths
  });

  let selected: IType | boolean = generator.collected.get(path)!;

  console.log('selected path: ', selected.describe());
  let types: IType[] = generator.expand(selected);
  let child: IType | boolean;

  while (true) {
    let choices: (string | Separator)[] = types.map(t => t.path());
    if (child && (child as IType).parent) {
      choices.push(new Separator());
      choices.push('Up to: ' + (child as IType).parent.path());
    }

    let path: string;
    if (_.isEmpty(choices)) {
      const parent = (child as IType).parent;
      path = parent!.path();
    }
    else {
      path = await select({
        message: `In: ${(child as IType)?.path() ?? selected.path()}`,
        choices: choices
      })
    }

    if (path.startsWith("Up to:")) {
      const parent = (child as IType).parent;
      path = parent!.path();
    }

    child = (selected as IType).find(path as string, Array.from(generator.collected.values()));
    if (!child) {
      console.log('Could not find type with path:', path);
      break;
    }

    types = (child as IType).expand(generator.getContext());
    console.log('expanded types: ', types.map(t => t.name));
  }

  console.log('types', types);
}

main().then(r => console.log('done'));