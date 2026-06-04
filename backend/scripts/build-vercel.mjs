import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/serverless-entry.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  outfile: 'api/express-bundle.cjs',
  format: 'cjs',
  sourcemap: false,
  minify: true,
  treeShaking: true,
  external: ['pg', 'pg-native'],
});

console.log('✓ Bundled API → api/express-bundle.cjs');
