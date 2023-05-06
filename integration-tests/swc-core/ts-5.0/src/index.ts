import { lz } from 'lazy-init'

const timeout = async (ms: number) => {
   return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

export const a = lz({ a: 'foo' })

export const b = lz([1, 2, { b: 3 }])

export const c = lz.fn(() => ({ c: 'bar' }))

export const d = async () => {
   const result = lz.async(async () => {
      await timeout(100)
      return { c: 'baz' }
   })
   return result
}
