import { defineConfig } from 'tsup'

const isDevelopment = process.env.NODE_ENV !== 'production'

const common = {
   entry: ['src/index.ts'] as string[],
   tsconfig: './tsconfig.build.json',
   target: 'es2020',
   sourcemap: isDevelopment,
   outDir: 'dist',
   clean: false,
   bundle: true,
   dts: true,
   minify: !isDevelopment,
   /**
    * Dependencies that should be bundled inline.
    * This should rarely be used.
    */
   noExternal: ['uft'] as string[],
} as const

export default defineConfig([
   /**
    * CJS (.js) (.d.ts)
    */
   {
      ...common,
      format: 'cjs',
      outDir: 'dist/cjs',
   },
   /**
    * ESM (.mjs) (.d.mts)
    */
   {
      ...common,
      format: 'esm',
      outDir: 'dist/esm',
   },
])
