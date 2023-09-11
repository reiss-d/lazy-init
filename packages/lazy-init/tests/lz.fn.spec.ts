import { lz } from 'lazy-init'
import { type AnyObject, assert, repeat, setup, toBe, toNotBe } from './utils'

describe('testing "lz.fn()" method', () => {
   test('return values of the same "lz.fn()" call are referentially equal', () => {
      let { one } = setup()

      // simple object
      one = () => lz.fn(() => ({ foo: 'bar' }))

      repeat(3, () => {
         toBe(one(), one())
      })

      // nested object
      one = () => lz.fn(() => ({ foo: { bar: 'buzz' } }))

      repeat(3, () => {
         toBe(one(), one())
      })

      // nested object with array
      one = () => lz.fn(() => ({ foo: { bar: 'buzz', arr: [1, 2, 3] } }))

      repeat(3, () => {
         toBe(one(), one())
      })
   })
   test('functions are only invoked once', () => {
      let { one } = setup()

      /**
       * No matter the passed `obj`, the return will always be the same.
       * @returns The first `obj` passed.
       */
      const firstObj = (obj: AnyObject) => lz.fn(() => obj)

      repeat(2, () => {
         toBe(firstObj({ a: 1 }), firstObj({ a: 2 }))
         toBe(firstObj({ b: 1 }), firstObj({ b: 2 }))
         toBe(firstObj({ a: 1 }), firstObj({ b: 2 }))

         const a = { a: 1 }
         toNotBe(firstObj(a), a)
         const b = { b: 2 }
         toNotBe(firstObj(b), b)
      })

      one = () =>
         lz.fn(
            // asserts that the function is only invoked once
            assert.once(() => ({}))
         )

      repeat(3, () => {
         one()
      })
   })
   test('can override default caching behaviour', () => {
      let { one, two, three } = setup()

      one = () => lz.fn(() => ({ foo: 'bar' }), { cache: true })
      two = () => lz.fn(() => ({ foo: 'bar' }), { cache: true })
      three = () => lz.fn(() => ({ foo: 'bar' }))

      repeat(3, () => {
         toBe(one(), two())
         toNotBe(one(), three())
         toNotBe(two(), three())
      })
   })
})
