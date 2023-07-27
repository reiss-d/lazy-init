/** @hidden */
type InferLiterals =
   | bigint
   | boolean
   | number
   | string

/** @hidden */
export type Infer<T> =
   | (T extends InferLiterals ? T : never)
   | (T extends [] ? [] : never)
   | ({ [K in keyof T]: T[K] extends Function ? T[K] : Infer<T[K]> })

/** @hidden */
export type NoInfer<T> = [T][T extends any ? 0 : never]
