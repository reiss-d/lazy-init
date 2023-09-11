import { defineConfig } from 'tsup'

const isDevelopment = process.env.NODE_ENV !== 'production'

const common = {
   entry: ['src/index.ts'] as string[],
   tsconfig: './tsconfig.build.json',
   target: 'es2020',
   sourcemap: isDevelopment,
   outDir: 'dist',
   clean: false,
   dts: false,
   bundle: true,
   minify: !isDevelopment,
   /**
    * Dependencies that should be bundled inline.
    * This should rarely be used.
    */
   noExternal: ['uft'] as string[],
} as const

export default defineConfig([
   /**
    * CJS (.js)
    *
    * Node supports both .cjs and .js, however browsers do not support .cjs.
    */
   {
      ...common,
      format: 'cjs',
      dts: true,
   },
   /**
    * ESM (.mjs)
    */
   {
      ...common,
      format: 'esm',
      outDir: 'dist/esm',
   },
   /**
    * ESM (.esm.js)
    *
    * This is useful for environments that support ESM but don't
    * allow .mjs files yet, for example certain bundlers.
    */
   {
      ...common,
      format: 'esm',
      outDir: 'dist/esm',
      outExtension({ format }) {
         return { js: `.${format}.js` }
      },
   },
])
