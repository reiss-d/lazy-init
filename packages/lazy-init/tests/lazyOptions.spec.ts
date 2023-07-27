import { lz } from 'lazy-init'
import { lz as lzc } from 'lazy-init/cache'
import type { LazyOptions } from '../src/methods'

const satisfiesOptions = (a: object, b: object, options: LazyOptions) => {
   const { cache = false, freeze = false } = options

   expect(Object.isFrozen(a)).toBe(freeze)
   expect(Object.isFrozen(b)).toBe(freeze)

   if (cache) {
      expect(a).toBe(b)
   } else {
      expect(a).not.toBe(b)
   }
}

describe('[lazy-init]: correct "lazyOptions" are applied by "lz" method', () => {
   test('`{ cache: false, freeze: false }` [default]', () => {
      const expectedOptions = { cache: false, freeze: false }

      satisfiesOptions(
         lz({ foo: 'bar' }, undefined),
         lz({ foo: 'bar' }, undefined),
         expectedOptions
      )
      satisfiesOptions(
         lz({ foo: 'bar' }, false),
         lz({ foo: 'bar' }, false),
         expectedOptions
      )
      satisfiesOptions(
         lz({ foo: 'bar' }, {}),
         lz({ foo: 'bar' }, {}),
         expectedOptions
      )
      satisfiesOptions(
         lz({ foo: 'bar' }, { cache: false }),
         lz({ foo: 'bar' }, { cache: false }),
         expectedOptions
      )
      satisfiesOptions(
         lz({ foo: 'bar' }, { freeze: false }),
         lz({ foo: 'bar' }, { freeze: false }),
         expectedOptions
      )
      satisfiesOptions(
         lz({ foo: 'bar' }, { cache: false, freeze: false }),
         lz({ foo: 'bar' }, { cache: false, freeze: false }),
         expectedOptions
      )
      satisfiesOptions(
         lz({ foo: 'bar' }, { cache: undefined, freeze: undefined }),
         lz({ foo: 'bar' }, { cache: undefined, freeze: undefined }),
         expectedOptions
      )
   })
   test('`{ cache: true, freeze: false }`', () => {
      const expectedOptions = { cache: true, freeze: false }

      satisfiesOptions(
         lz({ foo: 'bar' }, { cache: true, freeze: false }),
         lz({ foo: 'bar' }, { cache: true, freeze: false }),
         expectedOptions
      )
   })
   test('`{ cache: false, freeze: true }`', () => {
      const expectedOptions = { cache: false, freeze: true }

      satisfiesOptions(
         lz({ foo: 'bar' }, true),
         lz({ foo: 'bar' }, true),
         expectedOptions
      )
      satisfiesOptions(
         lz({ foo: 'bar' }, { freeze: true }),
         lz({ foo: 'bar' }, { freeze: true }),
         expectedOptions
      )
      satisfiesOptions(
         lz({ foo: 'bar' }, { cache: false, freeze: true }),
         lz({ foo: 'bar' }, { cache: false, freeze: true }),
         expectedOptions
      )
   })
   test('`{ cache: true, freeze: true }`', () => {
      const expectedOptions = { cache: true, freeze: true }

      satisfiesOptions(
         lz({ foo: 'bar' }, { cache: true }),
         lz({ foo: 'bar' }, { cache: true }),
         expectedOptions
      )
      satisfiesOptions(
         lz({ foo: 'bar' }, { cache: true, freeze: undefined }),
         lz({ foo: 'bar' }, { cache: true, freeze: undefined }),
         expectedOptions
      )
      satisfiesOptions(
         lz({ foo: 'bar' }, { cache: true, freeze: true }),
         lz({ foo: 'bar' }, { cache: true, freeze: true }),
         expectedOptions
      )
   })
})

describe('[lazy-init/cache]: correct "lazyOptions" are applied by "lz" method', () => {
   test('`{ cache: false, freeze: false }`', () => {
      const expectedOptions = { cache: false, freeze: false }

      satisfiesOptions(
         lzc({ foo: 'bar' }, { cache: false }),
         lzc({ foo: 'bar' }, { cache: false }),
         expectedOptions
      )
      satisfiesOptions(
         lzc({ foo: 'bar' }, { cache: false, freeze: false }),
         lzc({ foo: 'bar' }, { cache: false, freeze: false }),
         expectedOptions
      )
   })
   test('`{ cache: true, freeze: false }`', () => {
      const expectedOptions = { cache: true, freeze: false }

      satisfiesOptions(
         lzc({ foo: 'bar' }, false),
         lzc({ foo: 'bar' }, false),
         expectedOptions
      )
      satisfiesOptions(
         lzc({ foo: 'bar' }, { freeze: false }),
         lzc({ foo: 'bar' }, { freeze: false }),
         expectedOptions
      )
      satisfiesOptions(
         lzc({ foo: 'bar' }, { cache: undefined, freeze: false }),
         lzc({ foo: 'bar' }, { cache: undefined, freeze: false }),
         expectedOptions
      )
      satisfiesOptions(
         lzc({ foo: 'bar' }, { cache: true, freeze: false }),
         lzc({ foo: 'bar' }, { cache: true, freeze: false }),
         expectedOptions
      )
   })
   test('`{ cache: false, freeze: true }`', () => {
      const expectedOptions = { cache: false, freeze: true }

      satisfiesOptions(
         lzc({ foo: 'bar' }, { cache: false, freeze: true }),
         lzc({ foo: 'bar' }, { cache: false, freeze: true }),
         expectedOptions
      )
   })
   test('`{ cache: true, freeze: true } [default]`', () => {
      const expectedOptions = { cache: true, freeze: true }

      satisfiesOptions(
         lzc({ foo: 'bar' }, undefined),
         lzc({ foo: 'bar' }, undefined),
         expectedOptions
      )
      satisfiesOptions(
         lzc({ foo: 'bar' }, true),
         lzc({ foo: 'bar' }, true),
         expectedOptions
      )
      satisfiesOptions(
         lzc({ foo: 'bar' }, {}),
         lzc({ foo: 'bar' }, {}),
         expectedOptions
      )
      satisfiesOptions(
         lzc({ foo: 'bar' }, { cache: true }),
         lzc({ foo: 'bar' }, { cache: true }),
         expectedOptions
      )
      satisfiesOptions(
         lzc({ foo: 'bar' }, { freeze: true }),
         lzc({ foo: 'bar' }, { freeze: true }),
         expectedOptions
      )
      satisfiesOptions(
         lzc({ foo: 'bar' }, { cache: undefined, freeze: undefined }),
         lzc({ foo: 'bar' }, { cache: undefined, freeze: undefined }),
         expectedOptions
      )
      satisfiesOptions(
         lzc({ foo: 'bar' }, { cache: true, freeze: true }),
         lzc({ foo: 'bar' }, { cache: true, freeze: true }),
         expectedOptions
      )
   })
})
