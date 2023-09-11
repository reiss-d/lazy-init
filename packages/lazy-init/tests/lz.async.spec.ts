import { lz } from 'lazy-init'
import { timeout } from 'uft'
import { type AnyObject, assert, toBe } from './utils'

describe('testing "lz.async()" method', () => {
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
