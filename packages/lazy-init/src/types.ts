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
