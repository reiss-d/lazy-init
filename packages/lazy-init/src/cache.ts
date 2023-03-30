/*
 * Different entry point that enables caching by default.
 */
import { createLazy } from './base'
import { lazyAsync, lazyFn, lazyObj_cached } from './methods'

const lazy = createLazy(lazyObj_cached)

export { lazy as lz, lazyAsync, lazyFn }
export default lazy
