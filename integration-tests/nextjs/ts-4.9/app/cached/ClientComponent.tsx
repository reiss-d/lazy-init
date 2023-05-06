'use client'
import { lz } from 'lazy-init/cache'

export function Component() {
   const result = lz.fn(() => 'lazy fn cached')
   return (
      <div>
         {result}
      </div>
   )
}
