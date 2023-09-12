/* eslint-disable lazy-init/require-await */
import { assert, isDefined, isRetryOK, isString, isUndefined, retry } from 'uft'
import {
   type LazyOptions,
   applyLazyOptions,
   defaultOptions,
   normalizeOptions,
} from '../options'

interface PromiseMap extends Map<string, Promise<any>> {
   get<T>(key: string): Promise<T> | undefined
}

const promises = new Map() as PromiseMap

/**
 * Options object for the `lz.async` method.
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
    * The number of attempts to retry the asynchronous function before
    * throwing an error.
    * This means the function will be called at most `retries + 1` times.
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
} & LazyOptions

/**
 * Lazily initializes the result of an asynchronous function by
 * only running it **once**.
 *
 * The first call to the function will fetch the result.
 * Subsequent calls will return either:
 * - a promise that will resolve once the data is fetched
 * - the already fetched data.
 *
 * @param fn The asynchronous function to be lazily initialized.
 * @param options Optional {@link LazyAsyncOptions} object.
 * @returns The awaited value returned by `fn`.
 *
 * @example
 * ```ts
 * // `lz.async` must be called inside an `async` function.
 * const foo = async () => {
 *   // `await` is not required.
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
   options: LazyAsyncOptions<R> = defaultOptions
   // @ts-expect-error - TS expects a promise to be returned
): R {
   let {
      key,
      fallback,
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
    * @internal
    */
   // eslint-disable-next-line prefer-rest-params
   key ||= arguments[2]

   // this should never throw
   assert(
      !!key && isString(key),
      '[lazy-init]: `lz.async` is missing key. ' +
         `This is a bug, please report it.`
   )

   let promise = promises.get<R>(key)

   if (isUndefined(promise)) {
      promise = new Promise((resolve, reject) => {
         let ranCleanup = false

         const cleanup = () => {
            if (!ranCleanup) {
               promises.delete(key!)
               ranCleanup = true
            }
         }

         const onReject = (err: unknown) => {
            if (process.env.NODE_ENV !== 'production') {
               console.error(
                  '[lazy-init]: `lz.async` promise rejected.',
                  { key, err }
               )
            }
            onError?.(err)

            if (isDefined(fallback)) { onResolve(fallback) }
            else { reject(err) }

            cleanup()
         }

         const onResolve = (res: R) => {
            try {
               const result = applyLazyOptions(
                  res,
                  normalizeOptions(options, false)
               )
               assert(
                  isDefined(result),
                  '[lazy-init]: `lz.async` returned `undefined`, this will cause your function to run everytime it finishes resolving.'
               )
               resolve(result)
               onInitialized?.(result)
               cleanup()
            } catch (err) {
               onReject(err)
            }
         }

         retry(fn, retries, retryInterval)
            .then((res) => {
               if (isRetryOK(res)) {
                  onResolve(res.ok)
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
