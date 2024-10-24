import * as esbuild from 'esbuild';

await esbuild.build({
    entryPoints: ['backend/main.ts'],
    bundle: true,
    packages: 'external',
    platform: 'node',
    format: 'esm',
    outfile: 'server.js',
});
