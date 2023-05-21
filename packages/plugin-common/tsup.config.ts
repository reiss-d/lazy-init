import { defineConfig } from 'tsup'

export default defineConfig({
   entry: ['src/index.ts'],
   format: 'cjs',
   target: 'es2020',
   outDir: 'dist',
   clean: true,
   dts: true,
   minify: true,
   sourcemap: false,
})
