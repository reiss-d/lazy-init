export type AnyObject = Record<PropertyKey, any>

export const toBe = (a: unknown, b: unknown) => {
   expect(a).toBe(b)
}

export const toNotBe = (a: unknown, b: unknown) => {
   expect(a).not.toBe(b)
}

export const repeat = (n: number, fn: () => void) => {
   for (let i = 0; i < n; i++) {
      fn()
   }
}

export const setup = (): {
   one: () => AnyObject
   two: () => AnyObject
   three: () => AnyObject
} => {
   const x = () => ({})
   return { one: x, two: x, three: x }
}

/**
 * Creates a function that is restricted to invoking `func` `n` times. Repeat
 * calls greater than `n` will throw an error.
 */
function assertNCalls<Args extends unknown[], R>(
   func: (...args: Args) => R,
   n: number
) {
   let count = n
   return function(...args: Args) {
      if (count--) {
         /* @ts-ignore - ignore `this` type */
         return func.apply(this, args)
      }
      throw new Error(`Function invoked more than ${n} time/s.`)
   }
}

/**
 * Creates a function that is restricted to invoking `func` once. Repeat calls
 * to the function will throw an error.
 */
function assertOnce<Args extends unknown[], R>(func: (...args: Args) => R) {
   return assertNCalls(func, 1)
}

export const assert = {
   once: assertOnce,
   nCalls: assertNCalls,
}
