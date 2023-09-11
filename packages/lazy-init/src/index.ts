import { createLazy, lazyAsync, lazyFn, lazyObj } from './base'

const lazy = /*#__PURE__*/ createLazy(lazyObj)

export { lazy as lz, lazyAsync, lazyFn }
export default lazy

export type { Lazy } from './base'
