/*
 * This file contains a modified version of the `stableHash` function from
 * Vercel's `swr` package.
 *
 * The original source code can be found here:
 * https://github.com/vercel/swr/blob/589550bd0ff9532c720faf80d1ff7212ec157b15/_internal/utils/hash.ts
 *
 * `swr` is licensed under this MIT License:
 *
 * MIT License
 * Copyright (c) 2023 Vercel, Inc.
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/* eslint-disable */
import { isUndefined } from 'uft'

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
