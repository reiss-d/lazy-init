import type { LazyOptions } from './methods'

export const timeout = async (ms: number) => {
   return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

export const retry = async <R>(
   fn: () => Promise<R>,
   retries: number,
   interval: number
): Promise<{ ok: R } | { err: unknown }> => {
   try {
      const res = await fn()
      return { ok: res }
   } catch (err) {
      if (retries === 0) {
         return { err }
      }
      await timeout(interval)
      return retry(fn, retries - 1, interval)
   }
}

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
