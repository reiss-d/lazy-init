import { assert, isNullish } from 'uft'
import {
   type LazyOptions,
   applyLazyOptions,
   defaultOptions,
   normalizeOptions,
} from '../../options'

/**
 * Options object for the `lz.fn` method.
 * Extends {@link LazyOptions}.
 */
export type LazyFnOptions = {} & LazyOptions

/**
 * Lazily initializes the result of a function by only running it **once**.
 *
 * The first call to the function will get the result and hoist it into a
 * lazy variable. Subsequent calls will return the lazy variable.
 *
 * @param fn The function to be lazily initialized. Must not return `undefined` or `null`.
 * @param options Optional {@link LazyFnOptions} object.
 * @returns The value returned by `fn`.
 * @throws {Error} if the value returned by `fn` is `undefined` or `null`.
 *
 * @example
 * #### Basic Usage
 * ```ts
 * const foo = () => {
 *   const result = lz.fn(() => {
 *     console.log('this will only be logged once')
 *     return { bar: 1 }
 *   })
 *   return result // { bar: 1 }
 * }
 * const a = foo() // logs: 'this will only be logged once'
 * const b = foo() // does not log
 * a === b // true
 * ```
 *
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
   options: LazyFnOptions = defaultOptions
): R {
   const result = applyLazyOptions(
      fn(),
      normalizeOptions(options, false)
   )
   assert(!isNullish(result), onNullishResult)
   return result
}

export type LazyFn = typeof lazyFn

const onNullishResult = () =>
   '[lazy-init]: `lz.fn` returned `undefined` or `null`, ' +
   'this will cause your function to run everytime it is called.'
