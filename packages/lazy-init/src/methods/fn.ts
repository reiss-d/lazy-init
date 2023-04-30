import { cacheObject } from '../cached'

/**
 * Options object for the `lz.fn`/`lazyFn` method.
 */
export type LazyFnOptions = {
   /**
    * Set `true` to cache the object returned by the function.
    * Objects returned by functions are never cached by default.
    * @see [cache](https://github.com/reiss-d/lazy-init#cache)
    * @default false
    */
   cache?: boolean
}

/**
 * Lazily initializes the result of a function by only running it **once**.
 *
 * The first call to the function will get the result and hoist
 * it into a lazy variable.
 * Subsequent calls will return the lazy variable.
 *
 * @param fn The function to be lazily initialized.
 * @param options Optional [object](https://github.com/reiss-d/lazy-init#LazyFnOptions) with configured options.
 * @returns the value returned by `fn`.
 *
 * @example
 * ```ts
 * const foo = () => {
 *   const result = lz.fn(() => {
 *      console.log('this will only be logged once')
 *      return { bar: 1 }
 *   })
 *   return result // { bar: 1 }
 * }
 * const a = foo() // logs "this will only be logged once"
 * const b = foo() // does not log
 * a === b // true
 * ```
 * #### Plugin Transformation
 * *original code*
 * ```ts
 * const foo = () => {
 *   const result = lz.fn(() => ({ a: 1 }))
 * }
 * ```
 * *transformed code*
 * ```ts
 * var lzVar;
 * const foo = () => {
 *   const result = lzVar ??
 *      (lzVar = lz.fn(() => ({ a: 1 })))
 * }
 * ```
 */
export function lazyFn<R>(
   fn: () => R,
   options: LazyFnOptions = {}
): R {
   const result = fn()

   return options.cache
      ? cacheObject(result)
      : result
}

export type LazyFn = typeof lazyFn
