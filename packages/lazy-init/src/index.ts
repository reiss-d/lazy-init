import { createLazy } from './base'
import { lazyAsync, lazyFn, lazyObj } from './methods'

const lazy = createLazy(lazyObj)

export { lazy as lz, lazyAsync, lazyFn }
export default lazy
