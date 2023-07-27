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
type FreezeMode = 'deep' | 'shallow' | 'none'

const FREEZE_MODE = (process.env.LAZY_INIT_FREEZE_MODE || 'deep') as FreezeMode

const ownKeys = (typeof Reflect !== 'undefined' && Reflect.ownKeys) ||
   ((target) => [
      ...Object.getOwnPropertyNames(target),
      ...Object.getOwnPropertySymbols(target),
   ])

const deepFreeze = (obj: object): object => {
   const propNames = ownKeys(obj)

   for (let i = 0; i < propNames.length; i++) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const value = obj[i]
      if (
         value && (
            typeof value === 'object' ||
            typeof value === 'function'
         )
      ) {
         // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
         deepFreeze(value)
      }
   }
   return Object.freeze(obj)
}

const invalidFreezeMode = (): never => {
   throw new Error(
      `Invalid value for LAZY_INIT_FREEZE_MODE: ${FREEZE_MODE as string}.\n ` +
         `Possible values are: 'deep', 'shallow', 'none'.`
   )
}

// NOTE: all of these checks will be optimized away once env is inlined
export const freeze = FREEZE_MODE === 'deep'
   ? deepFreeze
   : FREEZE_MODE === 'shallow'
   ? Object.freeze
   : FREEZE_MODE === 'none'
   ? (obj: object): object => obj // noop
   : invalidFreezeMode()
