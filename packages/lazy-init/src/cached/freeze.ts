import { assert, isObjectLoose } from 'uft'

/**
 * Freeze mode values.
 * @default "deep"
 * @internal
 */
type FreezeMode = 'deep' | 'shallow' | 'none'

const FREEZE_MODE = (process.env.LAZY_INIT_FREEZE_MODE || 'deep') as FreezeMode

const ownKeys = (typeof Reflect !== 'undefined' && Reflect.ownKeys) ||
   ((target) => [
      ...Object.getOwnPropertyNames(target),
      ...Object.getOwnPropertySymbols(target),
   ])

/**
 * Recursively calls `Object.freeze` on objects/arrays.
 * @internal
 */
const deepFreeze = <T>(obj: T): T => {
   if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
         // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
         deepFreeze(obj[i])
      }
   } else if (
      isObjectLoose(obj) &&
      !(obj instanceof Set) &&
      !(obj instanceof Map)
   ) {
      for (const key of ownKeys(obj)) {
         // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
         deepFreeze(obj[key])
      }
   }
   return Object.freeze(obj)
}

// NOTE: all of these checks will be optimized away once env is inlined
export const freeze = FREEZE_MODE === 'deep'
   ? deepFreeze
   : FREEZE_MODE === 'shallow'
   ? Object.freeze
   : FREEZE_MODE === 'none'
   ? <T>(obj: T): T => obj // noop
   : assert(
      false,
      `[lazy-init]: Invalid value for "LAZY_INIT_FREEZE_MODE": ${FREEZE_MODE as string}. Possible values are: 'deep', 'shallow', 'none'.`
   ) as never
