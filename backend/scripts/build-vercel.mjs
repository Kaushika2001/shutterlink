import * esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/serverless-entry.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  outfile: 'api/express.js',
  format: 'cjs',
  sourcemap: false,
  minify: true,
  treeShaking: true,
  // pg is listed in package.json but unused — keep it out of the bundle
  external: ['pg', 'pg-native'],
});

console.log('✓ Bundled API → api/express.js');
