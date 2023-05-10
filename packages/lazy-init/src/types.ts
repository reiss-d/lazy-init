/** @hidden */
export type Value =
   | object
   | boolean
   | string
   | number
   | symbol
   | bigint
   | Function
   | null
   | undefined

/** @hidden */
export declare type Tuple<T = any> = [T?, ...T[]]

export type ArrayOrObject<T extends Value> =
   | T[]
   | Tuple<T>
   | Record<PropertyKey, T>
