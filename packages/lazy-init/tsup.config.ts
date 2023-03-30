import { defineConfig } from 'tsup'

const isDevelopment = process.env.NODE_ENV !== 'production'

const common = {
   entry: ['src/index.ts', 'src/cache.ts'] as string[],
   tsconfig: './tsconfig.build.json',
   target: 'es2020',
   sourcemap: isDevelopment,
   clean: true,
   dts: true,
   minify: !isDevelopment,
} as const

export default defineConfig([
   {
      ...common,
      format: ['esm', 'cjs'],
   },
   /** Import syntax without .mjs extension */
   {
      ...common,
      format: 'esm',
      outExtension({ format }) {
         return { js: `.${format}.js` }
      },
   },
])
