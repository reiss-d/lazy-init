import { normalizeOptions } from '../src/utils'
import type { LazyOptions } from '../src/methods'

type Options = Parameters<typeof normalizeOptions>[0]

describe('`normalizeOptions` returns the correct options', () => {
   test('when `cacheByDefault` is `false`', () => {
      const normalize = (options: Options, expected: LazyOptions) => {
         expect(normalizeOptions(options, false)).toEqual(expected)
      }

      normalize(
         true,
         { cache: false, freeze: true }
      )
      normalize(
         false,
         { cache: false, freeze: false }
      )
      normalize(
         {},
         { cache: false, freeze: false }
      )
      normalize(
         { cache: true },
         { cache: true, freeze: true }
      )
      normalize(
         { cache: false },
         { cache: false, freeze: false }
      )
      normalize(
         { freeze: true },
         { cache: false, freeze: true }
      )
      normalize(
         { freeze: false },
         { cache: false, freeze: false }
      )
      normalize(
         { cache: undefined, freeze: undefined },
         { cache: false, freeze: false }
      )
      normalize(
         { cache: true, freeze: true },
         { cache: true, freeze: true }
      )
      normalize(
         { cache: true, freeze: false },
         { cache: true, freeze: false }
      )
      normalize(
         { cache: false, freeze: true },
         { cache: false, freeze: true }
      )
      normalize(
         { cache: false, freeze: false },
         { cache: false, freeze: false }
      )
   })
   test('when `cacheByDefault` is `true`', () => {
      const normalize = (options: Options, expected: LazyOptions) => {
         expect(normalizeOptions(options, true)).toEqual(expected)
      }

      normalize(
         true,
         { cache: true, freeze: true }
      )
      normalize(
         false,
         { cache: true, freeze: false }
      )
      normalize(
         {},
         { cache: true, freeze: true }
      )
      normalize(
         { cache: true },
         { cache: true, freeze: true }
      )
      normalize(
         { cache: false },
         { cache: false, freeze: false }
      )
      normalize(
         { freeze: true },
         { cache: true, freeze: true }
      )
      normalize(
         { freeze: false },
         { cache: true, freeze: false }
      )
      normalize(
         { cache: undefined, freeze: undefined },
         { cache: true, freeze: true }
      )
      normalize(
         { cache: true, freeze: true },
         { cache: true, freeze: true }
      )
      normalize(
         { cache: true, freeze: false },
         { cache: true, freeze: false }
      )
      normalize(
         { cache: false, freeze: true },
         { cache: false, freeze: true }
      )
      normalize(
         { cache: false, freeze: false },
         { cache: false, freeze: false }
      )
   })
})
