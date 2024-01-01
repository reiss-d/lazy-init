import { transform } from '@swc/core'
import type { OnLoadArgs, PluginBuild } from 'esbuild'
import { readFile } from 'fs/promises'
import { extname } from 'path'
import { type Options, isExcluded, normalizeOptions } from './options'

interface Plugin {
   name: string
   // Using a looser type here so that this plugin can be used with different
   // compatible versions of esbuild without causing type errors.
   setup: (build: any) => void
}

type Extension = 'js' | 'jsx' | 'ts' | 'tsx'

export function lazyInitPlugin(options: Options = {}): Plugin {
   options = normalizeOptions(options)

   return {
      name: 'esbuild-plugin-lazy-init',
      setup(build: PluginBuild): void {
         build.onLoad(
            { filter: /\.(ts|tsx|js|jsx)$/, namespace: 'file' },
            onLoad(options)
         )
      },
   }
}

const onLoad = (options: Options) => async (args: OnLoadArgs) => {
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

const applyTransform = async (code: string, ext: string) => {
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
            plugins: [['@lazy-init/plugin-swc-v83', {}]],
         },
      },
   })
   return result.code
}
