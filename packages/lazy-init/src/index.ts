import { lazyAsync, lazyFn, lazyObj, lazyObjCached } from './methods'
import type { LazyAsyncFn, LazyFn, LazyObj } from './methods'

export type Lazy = LazyObj & { fn: LazyFn; async: LazyAsyncFn }

/**
 * Creates the `lz` function with property methods `fn` & `async`
 * using the underlying `LazyObj` function.
 * @internal
 */
function createLazy(base: LazyObj): Lazy {
   const lazy = base as Lazy
   lazy.fn = lazyFn
   lazy.async = lazyAsync
   return lazy
}

const lazy = /*#__PURE__*/ createLazy(lazyObj)
const lazyCached = /*#__PURE__*/ createLazy(lazyObjCached)

export { lazy as lz, lazyCached as lzc }
export default lazy
