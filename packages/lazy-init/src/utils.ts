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

export const normalizeOptions = (
   optionsOrFreeze?: LazyOptions | boolean
): LazyOptions => {
   if (optionsOrFreeze === undefined) { return {} }
   if (typeof optionsOrFreeze === 'object') { return { ...optionsOrFreeze } }
   return { freeze: optionsOrFreeze }
}
