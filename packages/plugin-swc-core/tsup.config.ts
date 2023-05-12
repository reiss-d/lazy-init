import { defineConfig } from 'tsup'

export default defineConfig({
   entry: ['src/postinstall.ts'],
   format: 'cjs',
   target: 'es2020',
   outDir: 'dist',
   clean: false,
   dts: false,
   minify: true,
   sourcemap: false,
})
