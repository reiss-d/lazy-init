import { transform } from '@swc/core'
import type { OnLoadArgs, PluginBuild } from 'esbuild'
import { readFile } from 'fs/promises'
import { extname } from 'path'
import { assert } from 'uft'
import resolve from 'resolve-from'
import { type Options, isExcluded, normalizeOptions } from './options'

interface Plugin {
   name: string
   // Using a looser type here so that this plugin can be used with different
   // compatible versions of esbuild without causing type errors.
   setup: (build: any) => void
}

type Extension = 'js' | 'jsx' | 'ts' | 'tsx'
type Transform = (code: string, ext: string) => Promise<string>

export function lazyInitPlugin(options: Options = {}): Plugin {
   const pluginPath = getPluginPath()
   assert(
      !!pluginPath,
      '[@lazy-init/esbuild-plugin] Failed to find plugin dependency.'
   )
   options = normalizeOptions(options)

   const applyTransform: Transform = async (code, ext) => {
      const syntax = ext === 'ts' || ext === 'tsx'
         ? 'typescript'
         : 'ecmascript'

      const result = await transform(code, {
         swcrc: false,
         minify: false,
         jsc: {
            target: 'esnext',
            parser: { syntax },
            preserveAllComments: true,
            keepClassNames: true,
            experimental: {
               /* @ts-ignore - types not updated by swc */
               keepImportAttributes: true,
               // TODO: is this needed?
               // disableBuiltinTransformsForInternalTesting: true,
               plugins: [[pluginPath, {}]],
            },
         },
      })
      return result.code
   }

   return {
      name: 'esbuild-plugin-lazy-init',
      setup(build: PluginBuild): void {
         build.onLoad(
            { filter: /\.(ts|tsx|js|jsx)$/, namespace: 'file' },
            onLoad(options, applyTransform)
         )
      },
   }
}

const onLoad = (
   options: Options,
   applyTransform: Transform
) => {
   return async (args: OnLoadArgs) => {
      try {
         const { path } = args

         if (isExcluded(options, path)) { return undefined }

         const ext = extname(path).slice(1) as Extension
         const code = await readFile(path, 'utf8')

         if (!code.includes('lazy-init')) { return undefined }

         return {
            contents: await applyTransform(code, ext),
            loader: ext,
         }
      } catch (error) {
         console.log('[@lazy-init/esbuild-plugin] Error: ', error)
         return undefined
      }
   }
}

const getPluginPath = () => {
   const pkg = '@lazy-init/plugin-swc-v83'

   try {
      const p = require.resolve(pkg)
      if (p) { return p }
   } catch {
      // ignore
   }

   try {
      return resolve(process.cwd(), pkg)
   } catch (error) {
      console.error(
         `[@lazy-init/esbuild-plugin] Failed to find dependency "${pkg}": `,
         error
      )
      return undefined
   }
}
