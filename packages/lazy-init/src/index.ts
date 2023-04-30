import { createLazy, lazyAsync, lazyFn, lazyObj } from './base'

const lazy = createLazy(lazyObj)

export { lazy as lz, lazyAsync, lazyFn }
export default lazy
