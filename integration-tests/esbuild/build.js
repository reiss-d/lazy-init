const { lazyInitPlugin } = require('@lazy-init/esbuild-plugin')
const esbuild = require('esbuild')
const { sync } = require('fast-glob')

void esbuild.build({
   entryPoints: sync(['src/**/*.ts', 'src/**/*.tsx']),
   bundle: false,
   format: 'cjs',
   outdir: 'dist',
   platform: 'node',
   tsconfig: './tsconfig.json',
   plugins: [lazyInitPlugin({ include: ['src'] })],
})
