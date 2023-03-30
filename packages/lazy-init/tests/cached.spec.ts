import { lz } from 'lazy-init/cache'
import { repeat, setup, toBe, toNotBe } from './utils'

describe(`[lazy-init/cache]: testing "lz()" method`, () => {
   test('identical objects are referentially equal', () => {
      let { one, two } = setup()

      // simple object
      one = () => lz({ foo: 'bar' })
      two = () => lz({ foo: 'bar' })

      repeat(3, () => {
         toBe(one(), two())
      })

      // nested object
      one = () => lz({ foo: { bar: 'buzz' } })
      two = () => lz({ foo: { bar: 'buzz' } })

      repeat(3, () => {
         toBe(one(), two())
      })

      // nested object with array
      one = () => lz({ foo: { bar: 'buzz', arr: [1, 2, 3] } })
      two = () => lz({ foo: { bar: 'buzz', arr: [1, 2, 3] } })

      repeat(3, () => {
         toBe(one(), two())
      })
   })

   test('non-identical objects are not referentially equal', () => {
      let { one, two } = setup()

      // simple object
      one = () => lz({ foo: 'bar' })
      two = () => lz({ bar: 'bar' })

      repeat(3, () => {
         toNotBe(one(), two())
      })

      // nested object
      one = () => lz({ foo: { bar: 'buzz' } })
      two = () => lz({ foo: { bar: 'foo' } })

      repeat(3, () => {
         toNotBe(one(), two())
      })

      // nested object with array
      one = () => lz({ foo: { bar: 'buzz', arr: [1, 2, 3] } })
      two = () => lz({ foo: { bar: 'buzz', arr: [1, 2] } })

      repeat(3, () => {
         toNotBe(one(), two())
      })
   })

   test('can override default caching behaviour', () => {
      let { one, two, three } = setup()

      one = () => lz({ foo: 'bar' }, { cache: false })
      two = () => lz({ foo: 'bar' }, { cache: false })
      three = () => lz({ foo: 'bar' })

      repeat(3, () => {
         toNotBe(one(), two())
         toNotBe(one(), three())
         toNotBe(two(), three())
      })
   })
})
