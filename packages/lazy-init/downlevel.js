/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs/promises')
const path = require('path')
const shelljs = require('shelljs')

const indicator = {
   start: '/**#__TS5_START__*/',
   end: '/**#__TS5_END__*/',
}
const ts5Types = process.argv.includes('--ts5')

void main()

async function main() {
   const distDir = path.join(__dirname, 'dist')

   let files = ts5Types
      ? shelljs.find(path.join(distDir, 'ts5.0/*.d.ts'))
      : shelljs.find(path.join(distDir, './*.d.ts'))

   await Promise.all(files.map(async (file) => {
      const content = await fs.readFile(file, 'utf8')
      const newContent = processContent(content, !ts5Types)

      if (!newContent) { return }

      return fs.writeFile(file, newContent, 'utf8')
   }))

   files.forEach((file) => {
      const dir = path.dirname(file)
      const fileName = path.basename(file).slice(0, -5)

      /**
       * CommonJS entrypoint and the ES module entrypoint each needs its own declaration file.
       * See - https://www.typescriptlang.org/docs/handbook/esm-node.html#packagejson-exports-imports-and-self-referencing:~:text=each%20needs%20its%20own%20declaration
       */
      const exts = [`esm.d.ts`, `d.mts`]

      exts.forEach((ext) => {
         shelljs.cp('-R', file, path.join(dir, `esm/${fileName}.${ext}`))
      })
   })

   files = ts5Types
      ? shelljs.find('dist/ts5.0/esm/*.esm.d.ts', 'dist/ts5.0/esm/*.d.mts')
      : shelljs.find('dist/esm/*.esm.d.ts', 'dist/esm/*.d.mts')

   const regex = /((?:import|export).*\bfrom\b.*['"]\S+)(\.js)(['"])/g

   files.forEach((file) => {
      const replaceExt = file.endsWith('.d.mts')
         ? '.mjs'
         : file.endsWith('.esm.d.ts')
         ? '.esm.js'
         : null

      if (!replaceExt) { return }

      shelljs.sed('-i', regex, `$1${replaceExt}$3`, file)
   })
}

/**
 * @param {string} content
 * @param {boolean} removeTypes
 */
function processContent(content, removeTypes) {
   if (!content.includes(indicator.start)) { return null }

   let result = ''
   let insideTs5Type = false
   let madeChanges = false

   /** @param {string} line */
   const push = (line) => (result += line + '\n')

   for (const line of content.split('\n')) {
      if (!insideTs5Type) {
         if (line.trim() === indicator.start) {
            madeChanges = true
            insideTs5Type = true
         } else {
            push(line)
         }
         continue
      }

      if (line.trim() === indicator.end) {
         insideTs5Type = false
      } else if (!removeTypes) {
         push(line)
      }
   }

   return madeChanges ? result : null
}
