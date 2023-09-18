import { lz, lzc } from 'lazy-init'

const timeout = async (ms: number) => {
   return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

export const a = lz({ a: 'foo' })
export const a_c = lzc({ a: 'foo' })

export const b = lz([1, 2, { b: 3 }])
export const b_c = lzc([1, 2, { b: 3 }])

export const c = lz.fn(() => ({ c: 'bar' }))
export const c_c = lzc.fn(() => ({ c: 'bar' }))

export const d = async () => {
   const result = lz.async(async () => {
      await timeout(100)
      return { c: 'baz' }
   })
   return result
}
export const d_c = async () => {
   const result = lzc.async(async () => {
      await timeout(100)
      return { c: 'baz' }
   })
   return result
}
