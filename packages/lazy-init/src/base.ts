import { lazyAsync, lazyFn } from './methods'
import type { LazyAsyncFn, LazyFn, LazyObj, LazyOptions } from './methods'
import type { Key, Value } from './types'

export interface Lazy {
   <
      T extends Record<Key, V1 | V2>,
      V1 extends Value,
      V2 extends Record<Key, V1 | V3>,
      V3 extends Record<Key, V1>,
   >(
      value: T,
      options?: boolean | LazyOptions
   ): T

   fn: LazyFn

   async: LazyAsyncFn
}

/**
 * Creates the `lz` function with property methods `fn` & `async`
 * using the underlying `LazyObj` function.
 * @hidden
 */
export function createLazy(base: LazyObj): Lazy {
   const lazy = base as Lazy
   lazy.fn = lazyFn
   lazy.async = lazyAsync
   return lazy
}
