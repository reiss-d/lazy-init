import { minimatch } from 'minimatch'

export const isMatch = (path: string, patterns: string[]): boolean => {
   for (let i = 0; i < patterns.length; i++) {
      if (minimatch(path, patterns[i]!)) {
         return true
      }
   }
   return false
}
