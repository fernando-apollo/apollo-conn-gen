const { build } = require('esbuild');
const { dependencies, devDependencies } = require('./package.json');
const { Generator } = require('npm-dts');

new Generator({
  entry: 'src/index.ts',
  output: 'dist/index.d.ts',
}).generate();

const sharedConfig = {
  entryPoints: ['./src/index.ts'],
  bundle: true,
  minify: false,
  keepNames: true,
  // external: true,
  external: Object.keys(dependencies)
    .concat(['fs', 'path', 'util', 'http', '@readme/postman-to-openapi'])
    .concat(Object.keys(devDependencies)),
  packages: 'external',
  sourcemap: true,
};

build({
  ...sharedConfig,
  platform: 'neutral', // for CJS
  outdir: 'dist',
});

build({
  ...sharedConfig,
  // outfile: 'dist/index.esm.js',
  platform: 'node', // for ESM
  outdir: 'dist',
  format: 'esm',
});
