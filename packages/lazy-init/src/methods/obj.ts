import type { DeepWritable } from 'ts-essentials'
import { normalizeOptions } from '../utils'
import { cacheObject } from '../cached'
import type { Key, Value } from '../types'

/**
 * Options object for the `lz` function.
 */
export type LazyOptions = {
   /**
    * Set `true` to freeze the object.
    * @default false
    */
   freeze?: boolean
   /**
    * Set `true` to cache the object.
    * Setting `true` | `false` will override the default behavior.
    *
    * Import from `"lazy-init/cache"` to **enable** caching by default.
    */
   cache?: boolean
}

/**
 * Lazily initialize an object by only creating it **once**.
 * The first call to `lz` will create the object and hoist
 * it into a lazy variable. After which the same object will
 * be returned without any calls to `lz`.
 *
 * @param value The object to lazily initialize.
 * @param options Optional `true` to freeze the object, or a [LazyOptions](https://github.com/reiss-d/lazy-init#lz-options) object.
 * @returns the initialized object.
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
 * *caching results in only a single object being created for the given object structure.*
 * @example
 * ```ts
 *   const foo = lz({ a: 1 }, { cache: true })
 *   const bar = lz({ a: 1 }, { cache: true })
 *   foo === bar // true
 *   const buzz = lz({ a: 1 }, { cache: false })
 *   foo === buzz // false
 * ```
 * #### Default Caching Behavior
 * *import path changes the default caching behavior.*
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
/**#__TS5_START__*/

// array/object (exact)
export function lazyObj<
   const T extends object,
>(
   value: T,
   options?: boolean | LazyOptions
): DeepWritable<T>

/**#__TS5_END__*/

// array (inferred)
export function lazyObj<
   T extends any[],
>(
   value: T,
   options?: boolean | LazyOptions
): T

// object (inferred)
export function lazyObj<
   T extends Record<Key, V1 | V2>,
   V1 extends Value,
   V2 extends Record<Key, V1 | V3>,
   V3 extends Record<Key, V1>,
>(
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
