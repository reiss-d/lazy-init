/** @internal */
type InferLiterals =
   | bigint
   | boolean
   | number
   | string

/** @internal */
export type Infer<T> =
   | (T extends InferLiterals ? T : never)
   | (T extends [] ? [] : never)
   | ({ [K in keyof T]: T[K] extends Function ? T[K] : Infer<T[K]> })

/** @internal */
export type NoInfer<T> = [T][T extends any ? 0 : never]
