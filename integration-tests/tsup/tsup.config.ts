import { defineConfig } from 'tsup'
import { lazyInitPlugin } from '@lazy-init/esbuild-plugin'

export default defineConfig({
   entry: ['src'],
   tsconfig: './tsconfig.json',
   target: 'es2020',
   outDir: 'dist',
   format: 'cjs',
   sourcemap: false,
   clean: false,
   bundle: false,
   dts: false,
   minify: false,
   esbuildPlugins: [lazyInitPlugin({ include: ['src'] })],
})
