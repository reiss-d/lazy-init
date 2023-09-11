import { lz } from 'lazy-init'
import { type AnyObject, repeat, setup, toBe, toNotBe } from './utils'

describe('testing "lz()" method', () => {
   test('objects returned by the same "lz()" call are referentially equal', () => {
      let { one } = setup()

      // simple object
      one = () => lz({ foo: 'bar' })

      repeat(3, () => {
         toBe(one(), one())
      })

      // nested object
      one = () => lz({ foo: { bar: 'buzz' } })

      repeat(3, () => {
         toBe(one(), one())
      })

      // nested object with array
      one = () => lz({ foo: { bar: 'buzz', arr: [1, 2, 3] } })

      repeat(3, () => {
         toBe(one(), one())
      })
   })
   test('calls to "lz()" are only invoked once', () => {
      /**
       * No matter the passed `obj`, the return will always be the same.
       * @returns The first `obj` passed.
       */
      const firstObj = (obj: AnyObject) => lz(obj)

      repeat(2, () => {
         toBe(firstObj({ a: 1 }), firstObj({ a: 2 }))
         toBe(firstObj({ b: 1 }), firstObj({ b: 2 }))
         toBe(firstObj({ a: 1 }), firstObj({ b: 1 }))

         const a = { a: 1 }
         toNotBe(firstObj(a), a)
         const b = { b: 1 }
         toNotBe(firstObj(b), b)
      })
   })
   test('identical objects are not referentially equal', () => {
      let { one, two } = setup()

      // simple object
      one = () => lz({ foo: 'bar' })
      two = () => lz({ foo: 'bar' })

      repeat(3, () => {
         toNotBe(one(), two())
      })

      // nested object
      one = () => lz({ foo: { bar: 'buzz' } })
      two = () => lz({ foo: { bar: 'buzz' } })

      repeat(3, () => {
         toNotBe(one(), two())
      })

      // nested object with array
      one = () => lz({ foo: { bar: 'buzz', arr: [1, 2, 3] } })
      two = () => lz({ foo: { bar: 'buzz', arr: [1, 2, 3] } })

      repeat(3, () => {
         toNotBe(one(), two())
      })
   })
   test('can override default caching behaviour', () => {
      let { one, two, three } = setup()

      one = () => lz({ foo: 'bar' }, { cache: true })
      two = () => lz({ foo: 'bar' }, { cache: true })
      three = () => lz({ foo: 'bar' })

      repeat(3, () => {
         toBe(one(), two())
         toNotBe(one(), three())
         toNotBe(two(), three())
      })
   })
})
