import { cacheObject, freeze as freezeObj } from './cached'

/**
 * Options object to customize the behaviour of lazy methods.
 *
 * Setting the value of the {@link LazyOptions.cache | cache} property may
 * change the default value of the {@link LazyOptions.freeze | freeze} property.
 *
 * See {@link https://github.com/reiss-d/lazy-init/blob/main/README.md#caching | caching} and
 * {@link https://github.com/reiss-d/lazy-init/blob/main/README.md#freezing | freezing} for
 * more information.
 */
export type LazyOptions = {
   /**
    * Whether to {@link https://github.com/reiss-d/lazy-init/blob/main/README.md#caching | cache}
    * the lazy value.
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
   cache?: boolean
   /**
    * Whether to {@link https://github.com/reiss-d/lazy-init/blob/main/README.md#freezing | freeze} the lazy value.
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
   freeze?: boolean
}

/** @internal */
export const defaultOptions: LazyOptions = Object.freeze({
   cache: false,
   freeze: false,
})

/** @internal */
export const defaultCacheOptions: LazyOptions = Object.freeze({
   cache: true,
   freeze: true,
})

/**
 * If `cache` or `cacheByDefault` is `true`, then `freeze` is `true` unless
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
