import { lzc } from 'lazy-init'
import { Component } from './ClientComponent'

export default function Page() {
   const a = lzc({ a: 'foo' })
   const b = lzc([1, 2, { b: 3 }])
   const c = lzc.fn(() => ({ c: 'bar' }))

   return (
      <div>
         <Component />
         {JSON.stringify([a, b, c])}
      </div>
   )
}
