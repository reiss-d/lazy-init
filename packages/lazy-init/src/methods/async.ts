/* eslint-disable lazy-init/require-await */
import { retry } from '../utils'
import { cacheObject } from '../cached'

interface PromiseMap extends Map<string, Promise<any>> {
   get<T>(key: string): Promise<T> | undefined
}

const promises = new Map() as PromiseMap

/**
 * Options object for the `lz.async`/`lazyAsync` method.
 * @typeParam R - type of the awaited value returned by `fn`.
 */
export type LazyAsyncOptions<R> = {
   /**
    * A unique identifier used to deduplicate multiple calls to the function
    * before the asynchronous value has been initialized.
    *
    * The lazy-init plugin will automatically generate a unique key,
    * however, you can provide your own value if needed.
    * @default "abc..." // 12 char string [a-zA-Z0-9]
    */
   key?: string
   /**
    * Provide a fallback value that will be used if the asynchronous
    * function throws an error.
    *
    * If no fallback value is provided, the error will be thrown.
    */
   fallback?: R
   /**
    * Set `true` to cache the object returned by the function.
    * Objects returned by functions are never cached by default.
    *
    * @default false
    */
   cache?: boolean
   /**
    * The number of attempts to retry the asynchronous function before
    * throwing an error.
    * @default 0
    */
   retries?: number
   /**
    * The time *(ms)* to wait between each retry attempt.
    * @default 250
    */
   retryInterval?: number
   /**
    * Called when the asynchronous function is successfully resolved.
    */
   onInitialized?: (res: R) => void
   /**
    * Called if the asynchronous function throws an error.
    */
   onError?: (err: unknown) => void
}

/**
 * Lazily initializes the result of an asynchronous function by
 * only running it **once**.
 *
 * The first call to the function will fetch the result.
 * Subsequent calls will return either:
 * - a promise that will resolve once the data is fetched
 * - the already fetched data.
 *
 * @param fn The Asynchronous function to be lazily initialized.
 * @param options optional [LazyAsyncOptions](https://github.com/reiss-d/lazy-init#LazyAsyncOptions) object.
 * @returns The awaited value returned by `fn`.
 *
 * @example
 * ```ts
 * // `lz.async` must be called inside an `async` function
 * const foo = async () => {
 *   // `await` is not required
 *   const result = lz.async(async () => {
 *     console.log('fetching')
 *     const data = await fetchData()
 *     return data.json()
 *   })
 *   return result
 * }
 * foo() // logs "fetching"
 * foo() // does not log
 * ```
 * #### Plugin Transformation
 * *original code*
 * ```ts
 * const foo = async () => {
 *   const data = lz.async(() => fetch())
 * }
 * ```
 * *transformed code - notice the `await` has been added*
 * ```ts
 * var lzVar;
 * const foo = async () => {
 *   const data = lzVar ?? (lzVar = await lz.async(() => fetch()))
 * }
 * ```
 */
export async function lazyAsync<R>(
   fn: () => Promise<R>,
   options: LazyAsyncOptions<R> = {}
   // @ts-expect-error - TS expects a promise to be returned
): R {
   let {
      key,
      fallback,
      cache = false,
      retries = 0,
      retryInterval = 250,
      onInitialized,
      onError,
   } = options

   /**
    * The generated key will be the third argument in the function call.
    * We cannot insert the key into the options object because the user
    * would need to always pass an object literal. This is inconvenient
    * since the user may want to pass a variable that contains their
    * default options.
    * @hidden
    */
   // eslint-disable-next-line prefer-rest-params
   key ||= arguments[2]

   if (!key) {
      // this should never happen
      throw new Error('[lazy-init]: async function is missing key.')
   }

   let promise = promises.get<R>(key)

   if (promise == undefined) {
      promise = new Promise((resolve, reject) => {
         const cleanup = () => promises.delete(key!)

         const onReject = (err: unknown) => {
            if (process.env.NODE_ENV !== 'production') {
               console.error(
                  '[lazy-init]: lz.async promise rejected',
                  { key, err }
               )
            }
            onError?.(err)

            if (fallback !== undefined) { onResolve(fallback) }
            else { reject(err) }

            cleanup()
         }

         const onResolve = (res: R) => {
            resolve(
               cache
                  ? cacheObject(res)
                  : res
            )
            onInitialized?.(res)
         }

         retry(fn, retries, retryInterval)
            .then((res) => {
               if ('ok' in res) {
                  onResolve(res.ok)
                  cleanup()
               } else {
                  onReject(res.err)
               }
            })
            .catch(onReject)
      })
      promises.set(key, promise)
   }
   return promise as R
}

export type LazyAsyncFn = typeof lazyAsync
