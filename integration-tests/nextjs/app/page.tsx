import { lz } from 'lazy-init'
import { Component } from './ClientComponent'

export default function Page() {
   const a = lz({ a: 'foo' })
   const b = lz([1, 2, { b: 3 }])
   const c = lz.fn(() => ({ c: 'bar' }))
   const d = lz.block(() => {
      if (b.length > 0) {
         return JSON.stringify([a, b, c])
      }
      return 'empty'
   })

   return (
      <div>
         <Component />
         {d}
      </div>
   )
}
