import { lz } from 'lazy-init/cache'
import { Component } from './ClientComponent'

export default function Page() {
   const a = lz({ a: 'foo' })
   const b = lz([1, 2, { b: 3 }])
   const c = lz.fn(() => ({ c: 'bar' }))

   return (
      <div>
         <Component />
         {JSON.stringify([a, b, c])}
      </div>
   )
}
