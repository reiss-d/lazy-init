import { normalizeOptions } from '../utils'
import { cacheObject } from '../cached'
import type { Infer } from '../types'

/**
 * Options object for the `lz` function.
 */
export type LazyOptions = {
   /**
    * Set `true` to freeze the value.
    * @default false
    */
   freeze?: boolean
   /**
    * Set `true` to cache the value.
    * Setting `true` | `false` will override the default behavior.
    *
    * Import from `"lazy-init/cache"` to **enable** caching by default.
    */
   cache?: boolean
}

/**
 * Lazily initialize any non-primitive value by only creating it **once**.
 * The first call to `lz` will create the value and hoist it into a lazy
 * variable. After which the same value will be returned without additional
 * calls to `lz`.
 *
 * @param value The value to lazily initialize.
 * @param options `true` to freeze the value, or an object with configured options.
 * @returns The initialized value.
 *
 * @example
 * ```ts
 * const foo = () => {
 *   const obj = lz({ a: 1 })
 *   return obj
 * }
 * const a = foo()
 * const b = foo()
 * a === b // true
 * ```
 * #### Caching
 * *Caching results in only a single value ever being created for the given value structure.*
 * @example
 * ```ts
 *   const foo = lz({ a: 1 }, { cache: true })
 *   const bar = lz({ a: 1 }, { cache: true })
 *   foo === bar // true
 *   const buzz = lz({ a: 1 }, { cache: false })
 *   foo === buzz // false
 *   const diff = lz({ a: 2 }, { cache: true })
 *   foo === diff // false
 * ```
 * #### Default Caching Behavior
 * *Import path changes the default caching behavior.*
 * @example
 * ```ts
 * // not cached by default
 * import { lz } from 'lazy-init'
 *   lz({ a: 1 }) // not cached
 *   lz({ b: 1 }, { cache: true }) // cached
 *
 * // cached by default
 * import { lz } from 'lazy-init/cache'
 *   lz({ c: 1 }) // cached
 *   lz({ d: 1 }, { cache: false }) // not cached
 * ```
 * #### Use Case - React Hook
 * @example
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
   options?: boolean | LazyOptions
): T

// fallback
export function lazyObj<T>(
   value: T,
   options?: boolean | LazyOptions
): T

export function lazyObj(
   value: object,
   options?: boolean | LazyOptions
) {
   if (!options) { return value }

   options = normalizeOptions(options)
   options.freeze && Object.freeze(value)

   return options.cache
      ? cacheObject(value, options.freeze)
      : value
}

export type LazyObj = typeof lazyObj

/**
 * `lazyObj` with caching enabled by default to be exported
 * from `"lazy-init/cache"`.
 *
 * See {@link lazyObj} above.
 *
 * @hidden
 */
export const lazyObj_cached: LazyObj = (
   value: object,
   options?: boolean | LazyOptions
) => {
   if (options === undefined) { return lazyObj(value, true) }

   options = normalizeOptions(options)

   if (options.cache === undefined) { options.cache = true }
   return lazyObj(value, options)
}
