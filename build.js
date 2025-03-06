const { build } = require('esbuild');
const { dependencies } = require('./package.json');
const { Generator } = require('npm-dts');

new Generator({
  entry: 'src/parser/gen.ts',
  output: 'dist/index.d.ts',
}).generate();

const sharedConfig = {
  entryPoints: ['src/parser/gen.ts'],
  bundle: true,
  minify: false,
  keepNames: true,
  external: Object.keys(dependencies),
};

build({
  ...sharedConfig,
  platform: 'node', // for CJS
  outfile: 'dist/index.js',
});

build({
  ...sharedConfig,
  outfile: "dist/index.esm.js",
  platform: 'node', // for ESM
  format: "esm",
});