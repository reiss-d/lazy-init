import { extname, join, resolve } from 'path'
import { isEmpty } from 'uft'
import { isMatch } from './utils'

const node_modules = /(^|[/\\])node_modules([/\\]|$)/

export interface Options {
   include?: string[]
   exclude?: string[]
   /**
    * @default true
    */
   excludeNodeModules?: boolean
}

export const normalizeOptions = (options: Options): Options => {
   const { excludeNodeModules, include, exclude } = options

   return {
      ...options,
      // Exclude node_modules by default.
      excludeNodeModules: excludeNodeModules ?? true,
      include: normalizePathMatchers(include),
      exclude: normalizePathMatchers(exclude),
   }
}

export const isExcluded = (options: Options, path: string) => {
   const { excludeNodeModules, include, exclude } = options

   return !!(
      excludeNodeModules && node_modules.test(path) ||
      include && !isMatch(path, include) ||
      exclude && isMatch(path, exclude)
   )
}

const normalizePathMatchers = (paths?: string[]) => {
   if (!paths || isEmpty(paths)) { return undefined }

   return paths.map((path) => {
      path = resolve(path)

      // If path is a directory, append '**' to match all files in that directory.
      if (!path.endsWith('*') && !extname(path)) {
         return join(path, '**')
      }
      return path
   })
}
