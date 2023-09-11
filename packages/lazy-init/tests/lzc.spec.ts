import { lzc } from 'lazy-init'
import { repeat, setup, toBe, toNotBe } from './utils'

describe(`testing "lzc()" method`, () => {
   test('identical objects are referentially equal', () => {
      let { one, two } = setup()

      // simple object
      one = () => lzc({ foo: 'bar' })
      two = () => lzc({ foo: 'bar' })

      repeat(3, () => {
         toBe(one(), two())
      })

      // nested object
      one = () => lzc({ foo: { bar: 'buzz' } })
      two = () => lzc({ foo: { bar: 'buzz' } })

      repeat(3, () => {
         toBe(one(), two())
      })

      // nested object with array
      one = () => lzc({ foo: { bar: 'buzz', arr: [1, 2, 3] } })
      two = () => lzc({ foo: { bar: 'buzz', arr: [1, 2, 3] } })

      repeat(3, () => {
         toBe(one(), two())
      })
   })

   test('non-identical objects are not referentially equal', () => {
      let { one, two } = setup()

      // simple object
      one = () => lzc({ foo: 'bar' })
      two = () => lzc({ bar: 'bar' })

      repeat(3, () => {
         toNotBe(one(), two())
      })

      // nested object
      one = () => lzc({ foo: { bar: 'buzz' } })
      two = () => lzc({ foo: { bar: 'foo' } })

      repeat(3, () => {
         toNotBe(one(), two())
      })

      // nested object with array
      one = () => lzc({ foo: { bar: 'buzz', arr: [1, 2, 3] } })
      two = () => lzc({ foo: { bar: 'buzz', arr: [1, 2] } })

      repeat(3, () => {
         toNotBe(one(), two())
      })
   })

   test('can override default caching behaviour', () => {
      let { one, two, three } = setup()

      one = () => lzc({ foo: 'bar' }, { cache: false })
      two = () => lzc({ foo: 'bar' }, { cache: false })
      three = () => lzc({ foo: 'bar' })

      repeat(3, () => {
         toNotBe(one(), two())
         toNotBe(one(), three())
         toNotBe(two(), three())
      })
   })
})
