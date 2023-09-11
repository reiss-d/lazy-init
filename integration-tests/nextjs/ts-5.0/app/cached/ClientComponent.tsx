'use client'
import { lzc } from 'lazy-init'

export function Component() {
   const result = lzc.fn(() => 'lazy fn cached')
   return (
      <div>
         {result}
      </div>
   )
}
