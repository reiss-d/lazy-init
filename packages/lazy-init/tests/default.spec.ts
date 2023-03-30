import { lz } from 'lazy-init'
import {
   type AnyObject,
   assert,
   repeat,
   setup,
   timeout,
   toBe,
   toNotBe,
} from './utils'

describe('[lazy-init]: testing "lz()" method', () => {
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

describe('[lazy-init]: testing "lz.fn()" method', () => {
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

describe('[lazy-init]: testing "lz.async()" method', () => {
   test('return values of the same "lz.async()" call are referentially equal', (done) => {
      const one = async () => {
         const res = lz.async(async () => {
            await timeout(5)
            return { foo: 'bar' }
         })
         return res
      }

      // test before promise resolves for the first time
      void Promise.all([one(), one(), one()])
         .then((resultsBefore) => {
            resultsBefore.forEach((result) => {
               toBe(result, resultsBefore[0])
            })

            // test after promise has resolved
            void Promise.all([one(), one(), one()])
               .then((resultsAfter) => {
                  resultsAfter.forEach((result) => {
                     toBe(result, resultsAfter[0])
                  })
                  done()
               })
         })
   })
   test('functions are only invoked once', (done) => {
      /**
       * No matter the passed `obj`, the return will always be the same.
       * @returns The first `obj` passed.
       */
      const firstObj = async (obj: AnyObject) => {
         const res = lz.async(async () => {
            await timeout(5)
            return obj
         })
         return res
      }

      void Promise.all([
         firstObj({ a: 1 }),
         firstObj({ a: 2 }),
         firstObj({ b: 1 }),
         firstObj({ b: 2 }),
      ])
         .then((results) => {
            toBe(results[0], results[1])
            toBe(results[2], results[3])
            toBe(results[0], results[3])
            done()
         })
   })
   test('functions are only invoked once', (done) => {
      const one = async () => {
         const res = lz.async(
            // asserts that the function is only invoked once
            assert.once(async () => {
               await timeout(5)
               return { foo: 'bar' }
            })
         )
         return res
      }

      // test after promise has resolved
      void Promise.all([one(), one(), one()])
         .then(() => {
            done()
         })
   })
})
