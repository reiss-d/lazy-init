import { isUndefined } from 'uft'
import {
   applyLazyOptions,
   defaultCacheOptions,
   normalizeOptions,
} from '../options'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { LazyOptions, ShouldCache, ShouldFreeze } from '../options'
import type { Infer, NoInfer } from '../types'

/**
 * Lazily initialize any non-primitive value by only creating it **once**.
 * The first call to `lz` will create the value and hoist it into a lazy
 * variable. After which the same value will be returned without additional
 * calls to `lz`.
 *
 * See {@link ShouldCache | caching} and {@link ShouldFreeze | freeze behaviour} for
 * more information on the available options.
 *
 * @param value The value to lazily initialize.
 * @param optionsOrFreeze Optional parameter that can be `true` to {@link ShouldFreeze | freeze} the value, or a {@link LazyOptions} object.
 * @returns The initialized value.
 *
 * @example
 * #### Basic Usage
 * ```ts
 * const foo = () => {
 *   const obj = lz({ a: 1 })
 *   return obj
 * }
 * const a = foo()
 * const b = foo()
 * a === b // true
 * ```
 *
 * #### Use Case - React Hook
 * ```ts
 * // `useHook` uses referential equality to compare
 * // it's arguments and if they have changed it will
 * // re-calculate the expensive value.
 * import { useHook } from 'some-lib'
 *
 * // this component will re-run the expensive
 * // calculation every time it renders.
 * const Component = () => {
 *   const expensiveValue = useHook({ users: 100 })
 *   // ...
 * }
 * // using `lz` this component will only run the
 * // expensive calculation once.
 * const BetterComponent = () => {
 *   const expensiveValue = useHook(lz({ users: 100 }))
 *   // ...
 * }
 * ```
 *
 * #### Caching
 * Caching results in only a single value ever being created for the given
 * value structure.
 * ```ts
 * const foo = lz({ a: 1 }, { cache: true })
 * const bar = lz({ a: 1 }, { cache: true })
 * foo === bar // true
 *
 * const buzz = lz({ a: 1 }, { cache: false })
 * foo === buzz // false
 *
 * const diff = lz({ a: 2 }, { cache: true })
 * foo === diff // false
 * ```
 *
 * To enable caching by default, use the `lzc` method. Note that this has the
 * implicit side-effect of also freezing by default unless explicitly disabled.
 * ```ts
 * import { lz, lzc } from 'lazy-init'
 *
 * // not cached by default
 * lz({ a: 1 }) // not cached
 * lz({ b: 1 }, { cache: true }) // cached
 *
 * // cached by default
 * lzc({ c: 1 }) // cached
 * lzc({ d: 1 }, { cache: false }) // not cached
 * ```
 *
 * #### Plugin Transformation
 * *original code*
 * ```ts
 * const foo = () => {
 *   const obj = lz({ a: 1 })
 * }
 * ```
 * *transformed code*
 * ```ts
 * var lzVar; // hoisted variable
 * const foo = () => {
 *   const obj = lzVar ?? (lzVar = lz({ a: 1 }))
 * }
 * ```
 */

// array/object (inferred)
export function lazyObj<T extends object>(
   value: Infer<T>,
   optionsOrFreeze?: LazyOptions | boolean
): NoInfer<T>

// fallback
export function lazyObj<T extends object>(
   value: T,
   optionsOrFreeze?: LazyOptions | boolean
): T

export function lazyObj(
   value: object,
   optionsOrFreeze?: LazyOptions | boolean
) {
   if (!optionsOrFreeze) { return value }

   return applyLazyOptions(
      value,
      normalizeOptions(optionsOrFreeze, false)
   )
}

export type LazyObj = typeof lazyObj

/**
 * `lazyObj` with caching enabled by default to be exported as `lzc`.
 * @internal
 */
export const lazyObjCached: LazyObj = (
   value: object,
   optionsOrFreeze?: LazyOptions | boolean
) => {
   return applyLazyOptions(
      value,
      isUndefined(optionsOrFreeze)
         ? defaultCacheOptions
         : normalizeOptions(optionsOrFreeze, true)
   )
}
