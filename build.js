const { build } = require('esbuild');
const { dependencies } = require('./package.json');

const sharedConfig = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  minify: true,
  keepNames: true,
  external: Object.keys(dependencies),
};

build({
  ...sharedConfig,
  platform: 'node', // for CJS
  outfile: 'dist/cli.js',
});
