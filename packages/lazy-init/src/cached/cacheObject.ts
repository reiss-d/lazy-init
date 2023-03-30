import { stableHash } from './stableHash'

type HashToObjectMap = Map<string, any>
const cacheStore: HashToObjectMap = new Map()
/**
 * Frozen objects return the same hash as non-frozen
 * objects so we need to store them separately.
 * @hidden
 */
const cacheStoreFrozen: HashToObjectMap = new Map()

const isDevelopment = process.env.NODE_ENV !== 'production'
/**
 * In development mode, we may not want to cache anything.
 * Caching is very slow and in development if the user is
 * **not** transpiling with swc and our plugin (not recommended),
 * the object is not actually lazily initialized.
 * Therefore it will be hashed every time it is created.
 * Whereas in production, the object will only be hashed
 * once (upon creation).
 * @hidden
 */
const noCacheInDevelopment = isDevelopment &&
   process.env.LAZY_INIT_DEV_NO_CACHE === 'true'

export const cacheObject = <T>(value: T, isFrozen?: boolean): T => {
   if (noCacheInDevelopment) { return value }

   const store = isFrozen ? cacheStoreFrozen : cacheStore
   try {
      const hash = stableHash(value)
      let obj = store.get(hash) as T | undefined

      if (obj === undefined) {
         obj = value
         store.set(hash, obj)
      }
      return obj
   } catch {
      return value
   }
}
