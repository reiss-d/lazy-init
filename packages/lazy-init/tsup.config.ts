import { defineConfig } from 'tsup'

const isDevelopment = process.env.NODE_ENV !== 'production'

const common = {
   entry: ['src/index.ts', 'src/cache.ts'] as string[],
   tsconfig: './tsconfig.build.json',
   target: 'es2020',
   sourcemap: isDevelopment,
   outDir: 'dist',
   clean: false,
   dts: false,
   minify: !isDevelopment,
} as const

export default defineConfig([
   {
      ...common,
      format: 'cjs',
      dts: true,
   },
   {
      ...common,
      format: 'esm',
      outDir: 'dist/esm',
   },
   /** Import syntax without .mjs extension */
   {
      ...common,
      format: 'esm',
      outDir: 'dist/esm',
      outExtension({ format }) {
         return { js: `.${format}.js` }
      },
   },
])
