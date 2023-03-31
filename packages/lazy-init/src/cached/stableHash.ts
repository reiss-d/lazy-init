/* eslint-disable */
const isUndefined = (v: any): v is undefined => v === undefined

// use WeakMap to store the object->key mapping
// so the objects can be garbage collected.
// WeakMap uses a hashtable under the hood, so the lookup
// complexity is almost O(1).
const table = new WeakMap<object, string>()

// counter of the key
let counter = 0

// A stable hash implementation that supports:
// - Fast and ensures unique hash properties
// - Handles unserializable values
// - Handles object key ordering
// - Generates short results
//
// This is not a serialization function, and the result is not guaranteed to be
// parsable.
export const stableHash = (value: any): string => {
   let ctor = value && value.constructor
   let hash: string

   if (ctor == Date) { return value.toJSON() }

   if (Object(value) === value && ctor != RegExp) {
      // Object/function, not null/date/regexp. Use WeakMap to store the id first.
      // If it's already hashed, directly return the result.
      const storedHash = table.get(value)
      if (storedHash) { return storedHash }

      // Store the hash first for circular reference detection before entering the
      // recursive `stableHash` calls.
      // For other objects like set and map, we use this id directly as the hash.
      hash = ++counter + '~'
      table.set(value, hash)

      if (ctor == Array) {
         // Array.
         hash = '@'
         for (let idx = 0; idx < value.length; idx++) {
            hash += stableHash(value[idx]) + ','
         }
         table.set(value, hash)
      }
      if (ctor == Object) {
         // Object, sort keys.
         const keys = Object.keys(value).sort()
         hash = '#'
         let key: string | undefined

         while (!isUndefined(key = keys.pop())) {
            if (!isUndefined(value[key])) {
               hash += key + ':' + stableHash(value[key]) + ','
            }
         }
         table.set(value, hash)
      }
      return hash
   }

   switch (typeof value) {
      case 'symbol': {
         return value.toString()
      }
      case 'string': {
         return JSON.stringify(value)
      }
      case 'bigint': {
         return '' + value + 'n'
      }
      default: {
         return '' + value
      }
   }
}
