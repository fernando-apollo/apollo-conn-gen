const { build } = require('esbuild');
const { dependencies, devDependencies } = require('./package.json');
const { Generator } = require('npm-dts');

new Generator({
  entry: 'src/index.ts',
  output: 'dist/index.d.ts',
}).generate();

const sharedConfig = {
  entryPoints: ['src/oas/gen.ts', 'src/json/walker/walker.ts'],
  bundle: true,
  minify: false,
  keepNames: true,
  external: Object.keys(dependencies)
    .concat(['fs', 'path', 'util', 'http', '@readme/postman-to-openapi'])
    .concat(Object.keys(devDependencies)),
  sourcemap: true,
};

build({
  ...sharedConfig,
  platform: 'neutral', // for CJS
  outdir: 'dist',
});

build({
  ...sharedConfig,
  platform: 'node', // for ESM
  outdir: 'dist',
  format: 'esm',
});
