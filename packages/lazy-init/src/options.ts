import { cacheObject, freeze as freezeObj } from './cached'

export const defaultOptions: LazyOptions = Object.freeze({
   cache: false,
   freeze: false,
})
export const defaultCacheOptions: LazyOptions = Object.freeze({
   cache: true,
   freeze: true,
})

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

   const {
      cache = cacheByDefault,
      freeze = cache,
   } = optionsOrFreeze

   return { cache, freeze }
}

/**
 * Applies the desired options to the given `value`.
 * @internal
 */
export const applyLazyOptions = <T>(
   value: T,
   options: LazyOptions
): T => {
   options.freeze && freezeObj(value)

   return options.cache
      ? cacheObject(value, options.freeze)
      : value
}

/**
 * Options object to customize the behaviour of lazy methods.
 *
 * @remarks
 * Setting the value of the {@link LazyOptions.cache | cache} property may
 * change the default value of the {@link LazyOptions.freeze | freeze} property.
 *
 * @see {@link ShouldCache | caching behaviour} and {@link ShouldFreeze | freezing behaviour}.
 */
export type LazyOptions = {
   /**
    * Whether to {@link ShouldCache | cache} the lazy value.
    *
    * When this is `true`, `freeze` defaults to `true` unless explicitly set
    * to `false`.
    *
    * @remarks
    * #### Behaviour with `lz`, `(lz|lzc).fn`, and `(lz|lzc).async`
    * - defaults to `false`.
    *
    * #### Behaviour with `lzc`
    * - defaults to `true`.
    *
    * Override the default behaviours by explicitly setting this property.
    */
   cache?: ShouldCache
   /**
    * Whether to {@link ShouldFreeze | freeze} the lazy value.
    *
    * When `cache` is `true`, this defaults to `true` unless explicitly set
    * to `false`.
    *
    * Override the default behaviours by explicitly setting this property.
    *
    * @remarks
    * #### Behaviour with `lz`, `(lz|lzc).fn`, and `(lz|lzc).async`
    * - *defaults to `false`*,
    * if `cache` is not set or explicitly set to `false` (default behaviour).
    *
    * - *defaults to `true`*,
    * if `cache` is explicitly set to `true`.
    *
    * #### Behaviour with `lzc`
    * - *defaults to `true`*,
    * if `cache` is not set or explicitly set to `true` (default behaviour).
    *
    * - *defaults to `false`*,
    * if `cache` is explicitly set to `false`.
    */
   freeze?: ShouldFreeze
}

/**
 * Caching results in only a single value ever being created for the given
 * value structure. This can improve performance and reduce memory usage.
 *
 * Caching can be enabled by setting the `cache` property to `true` on a
 * options object or by using the `lzc` method where caching is enabled by
 * default.
 *
 * @example
 * ```ts
 * // using `lz`
 * lz({ a: 1 }) // not cached
 * lz({ b: 1 }, { cache: true }) // cached
 * // using `lzc`
 * lzc({ c: 1 }) // cached
 * lzc({ d: 1 }, { cache: false }) // not cached
 * ```
 *
 * When caching is enabled, the value will also be frozen unless you explicitly
 * say otherwise. This is because caching an object that is not frozen is
 * dangerous. The object may mistakenly be mutated by the user, yet other
 * recipients of this cached object do not expect it to change.
 * ```ts
 * // using `lz`
 * lz({ a: 1 }) // N/A
 * lz({ b: 1 }, { cache: true, freeze: false }) // cached
 * lz({ c: 1 }, { cache: true }) // cached & frozen
 * // using `lzc`
 * lzc({ a: 1 }) // cached & frozen
 * lzc({ b: 1 }, { freeze: false }) // cached
 * lzc({ c: 1 }, { cache: false }) // N/A
 * ```
 *
 * Demonstrating the difference in behaviour of cached vs non-cached values:
 * ```ts
 * // `cfoo` and `cbar` share the same structure and are both
 * // cached, therefore they are the same object.
 * const cfoo = lzc({ a: 1 })
 * const cbar = lzc({ a: 1 })
 * cfoo === cbar // true
 *
 * // `cfoo` and `buzz` share the same structure, however, `buzz`
 * //  is not cached, therefore they are different objects.
 * const buzz = lzc({ a: 1 }, { cache: false })
 * cfoo === buzz // false
 *
 * // `cfoo` and `cdiff` are cached, however, they do not share the
 * // same structure and are therefore different objects.
 * const cdiff = lzc({ a: 5 })
 * cfoo === cdiff // false
 * ```
 *
 * There are separate caches for frozen and non-frozen objects. Therefore,
 * frozen and non-frozen objects with the same structure will not be the same
 * object.
 * ```ts
 * const cfoo = lzc({ a: 1 })
 * const cbar = lzc({ a: 1 }, { freeze: false })
 * cfoo === cbar // false
 * ```
 */
export type ShouldCache = boolean

/**
 * By default, freezing a value will perform a deep freeze on it.
 *
 * To change this behaviour, set the environment variable `LAZY_INIT_FREEZE_MODE`
 * to one of the following values:
 *
 * - `"deep"` (default)
 * - `"shallow"`
 * - `"none"`
 *
 * #### Deep Freeze
 *
 * The values of each key and symbol property will be recursively frozen.
 * However, this only applies to arrays and plain objects. Other objects such
 * as `Set` and `Map` will not be frozen.
 * ```ts
 * const foo = lz({
 *   val: 'bar',
 *   obj: { a: 0, b: [], c: new Set() },
 * }, true)
 * foo.val = 'buzz' // error
 * foo.obj.a = 2 // error
 * foo.obj.b.push(1) // error
 * foo.obj.c.add(1) // ok
 * foo.obj.c = null // error
 * ```
 *
 * #### Shallow Freeze
 *
 * Only the value itself will be frozen, not any of its array/object properties.
 * ```ts
 * const foo = lz({
 *   val: 'bar',
 *   obj: { a: 0 },
 * }, true)
 * foo.val = 'buzz' // error
 * foo.obj.a = 2 // ok
 * foo.obj = {} // error
 * ```
 *
 * #### None
 *
 * The value will not be frozen.
 */
export type ShouldFreeze = boolean
