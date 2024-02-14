import { block, lazyAsync, lazyFn, lazyObj, lazyObjCached } from './methods'
import type { Block, LazyAsyncFn, LazyFn, LazyObj } from './methods'

export type Lazy = LazyObj & {
   fn: LazyFn
   async: LazyAsyncFn
   block: Block
}

/**
 * Creates the `lz` function with property methods `block`, `fn` & `async`
 * using the underlying `LazyObj` function.
 * @internal
 */
function createLazy(base: LazyObj): Lazy {
   const lazy = base as Lazy
   lazy.fn = lazyFn
   lazy.async = lazyAsync
   lazy.block = block
   return lazy
}

export const lz = /*#__PURE__*/ createLazy(lazyObj)
export const lzc = /*#__PURE__*/ createLazy(lazyObjCached)

export { block }
