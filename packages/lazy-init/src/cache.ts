/*
 * Different entry point that enables caching by default.
 */
import { createLazy, lazyAsync, lazyFn, lazyObj_cached } from './base'

const lazy = createLazy(lazyObj_cached)

export { lazy as lz, lazyAsync, lazyFn }
export default lazy
