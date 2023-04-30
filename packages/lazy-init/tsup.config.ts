import { type Options, defineConfig } from 'tsup'

const isDevelopment = process.env.NODE_ENV !== 'production'

const common = {
   tsconfig: './tsconfig.build.json',
   target: 'es2020',
   sourcemap: isDevelopment,
   outDir: 'dist',
   clean: false,
   dts: false,
   minify: !isDevelopment,
} as const

function config(entry: string[], bundle = false): Options[] {
   const opts = { ...common, entry, bundle }

   return [
      {
         ...opts,
         format: 'cjs',
         dts: true,
      },
      {
         ...opts,
         format: 'esm',
         outDir: 'dist/esm',
      },
      /** Import syntax without .mjs extension */
      {
         ...opts,
         format: 'esm',
         outDir: 'dist/esm',
         outExtension({ format }) {
            return { js: `.${format}.js` }
         },
      },
   ]
}

export default defineConfig([
   ...config([
      'src/base.ts',
   ], true),
   ...config([
      'src/index.ts',
      'src/cache.ts',
   ]),
])
