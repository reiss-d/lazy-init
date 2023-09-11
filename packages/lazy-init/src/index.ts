import { createLazy, lazyAsync, lazyFn, lazyObj, lazyObjCached } from './base'

const lazy = /*#__PURE__*/ createLazy(lazyObj)
const lazyCached = /*#__PURE__*/ createLazy(lazyObjCached)

export { lazy as lz, lazyAsync, lazyCached as lzc, lazyFn }
export default lazy

export type { Lazy } from './base'
