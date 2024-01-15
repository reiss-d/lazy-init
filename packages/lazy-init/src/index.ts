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

const lazy = /*#__PURE__*/ createLazy(lazyObj)
const lazyCached = /*#__PURE__*/ createLazy(lazyObjCached)

export { block, lazy as lz, lazyCached as lzc }
export default lazy
