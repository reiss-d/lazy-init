import { block, lz } from 'lazy-init'

describe('testing "block" method', () => {
   test('"lz.block()" returns the correct result', () => {
      const cond = true
      const condA = false
      const condB = true

      const t0 = lz.block(() => {
         if (cond) {
            return 0
         } else {
            return 1
         }
      })
      expect(t0).toBe(0)

      const t1 = lz.block(() => {
         if (cond) {
            return 0
         }
         return 1
      })
      expect(t1).toBe(0)

      const t2 = lz.block(() => {
         if (condA) { return 0 }
         if (condB) { return 1 }
         return 3
      })
      expect(t2).toBe(1)

      const t3 = lz.block(() => {
         if (cond) { return 0 }
         else { return 1 }
      })
      expect(t3).toBe(0)

      const t4 = lz.block(() => {
         if (cond) { return 0 }
         return 1
      })
      expect(t4).toBe(0)
   })
   test('"block()" returns the correct result', () => {
      const cond = false
      const condA = true
      const condB = false

      const t0 = block(() => {
         if (cond) {
            return 0
         } else {
            return 1
         }
      })
      expect(t0).toBe(1)

      const t1 = block(() => {
         if (cond) {
            return 0
         }
         return 1
      })
      expect(t1).toBe(1)

      const t2 = block(() => {
         if (condA) { return 0 }
         if (condB) { return 1 }
         return 3
      })
      expect(t2).toBe(0)

      const t3 = block(() => {
         if (cond) { return 0 }
         else { return 1 }
      })
      expect(t3).toBe(1)

      const t4 = block(() => {
         if (cond) { return 0 }
         return 1
      })
      expect(t4).toBe(1)
   })
   test('switch "block()" returns the correct result', () => {
      let value = 0
      const t0 = block(() => {
         // lol br yeet
         switch (value) {
            case 0:
               return 'zero'
            case 1:
               return 'one'
            default:
               return 'default'
         }
      })
      expect(t0).toBe('zero')
      value = 1
      const t1 = block(() => {
         switch (value) {
            case 0:
               return 'zero'
            case 1:
               return 'one'
            default:
               return 'default'
         }
      })
      expect(t1).toBe('one')

      value = 2
      const t2 = block(() => {
         switch (value) {
            case 0:
               return 'zero'
            case 1:
               return 'one'
            default:
               return 'default'
         }
      })
      expect(t2).toBe('default')
   })
})
