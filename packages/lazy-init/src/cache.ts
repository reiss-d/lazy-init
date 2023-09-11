/*
 * Different entry point that enables caching by default.
 */
import { createLazy, lazyAsync, lazyFn, lazyObjCached } from './base'

const lazy = /*#__PURE__*/ createLazy(lazyObjCached)

export { lazy as lz, lazyAsync, lazyFn }
export default lazy

export type { Lazy } from './base'
