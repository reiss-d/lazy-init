/**
 * Block expression that will be *inlined*, removing the overhead of a
 * function call.
 *
 * @param body A function with no arguments and a body that is a block statement that returns/throws.
 * @param forceWrapped Pass any value as the second argument to force the block to be wrapped.
 * @returns The value returned by `body`.
 *
 * @remarks
 * All code paths within the block must end with a `return` statement, otherwise
 * the block will be inlined by wrapping it within a `labeled` statement.
 *
 * A `block(...)` call must always be on the RHS of a single variable
 * declaration, see `Proper Usage` below.
 *
 * @example
 *
 * #### Basic Usage
 * ```ts
 * function ternaryHater(age: number) {
 *    // can also use `lz.block()`
 *    const reply = block(() => {
 *       if (age < 18) { return 'Bedtime for you' }
 *       if (age < 21) { return 'Inspect ID 6 times' }
 *       if (age > 80) { return 'Not tonight, young man' }
 *       return 'Come on in'
 *    })
 *    // ...
 * }
 * ```
 *
 * #### Proper Usage
 * ```ts
 * // ✅ correct use (RHS of a single variable decl)
 * let a = block(() => { ... })
 * var b = block(() => { ... })
 * const c = block(() => { ... })
 *
 * // ❌ incorrect use
 * let a = 0, b = block(() => { ... })
 * let c = someFn(block(() => { ... }))
 * void block(() => { ... })
 * ```
 *
 * #### Plugin Transformation
 * *original code*
 * ```ts
 * let result = block(() => {
 *    if (condA) { return 0 }
 *    if (condB) { return 1 }
 *    return 2
 * })
 * ```
 * *transformed code*
 * ```ts
 * let result;
 * if (condA) { result = 0 }
 * else if (condB) { result = 1 }
 * else { result = 2 }
 * ```
 * *transformed code (with compress option)*
 * ```ts
 * let result;
 * result = condA ? 0 : condB ? 1 : 2;
 * ```
 */
export function block<R>(
   body: () => R,
   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   forceWrapped?: any
): R {
   // This function should never actually be called. Warn the user they haven't
   // transformed their code unless they've chosen to ignore it.
   if (
      process.env.NODE_ENV !== 'production' &&
      // eslint-disable-next-line turbo/no-undeclared-env-vars
      !process.env.LAZY_INIT_NO_BLOCK_WARNING
   ) {
      console.warn(
         '[lazy-init]: This `lz.block()` call has not been transformed.'
      )
   }
   return body()
}

export type Block = typeof block
