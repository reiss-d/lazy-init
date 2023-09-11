import type { LazyOptions } from './methods'

/**
 * If `cache || cacheByDefault` is `true`, then `freeze` is `true` unless
 * explicitly set to `false`.
 * @internal
 */
export const normalizeOptions = (
   optionsOrFreeze: LazyOptions | boolean,
   cacheByDefault: boolean
): LazyOptions => {
   if (typeof optionsOrFreeze === 'boolean') {
      return { cache: cacheByDefault, freeze: optionsOrFreeze }
   }

   let { cache, freeze } = optionsOrFreeze

   if (cache === undefined) {
      cache = cacheByDefault
   }
   if (freeze === undefined) {
      freeze = cache
   }
   return { cache, freeze }
}
