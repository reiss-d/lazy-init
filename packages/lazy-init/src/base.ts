import { lazyAsync, lazyFn } from './methods'
import type { LazyAsyncFn, LazyFn, LazyObj } from './methods'

export type Lazy = LazyObj & { fn: LazyFn; async: LazyAsyncFn }

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

/*
 * Re-exporting so that all entry points import from `base.ts`
 * to stop tsup from bundling the same code multiple times.
 */
export { lazyAsync, lazyFn, lazyObj, lazyObj_cached } from './methods'
