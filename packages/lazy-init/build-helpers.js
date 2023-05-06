// @ts-check
/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs/promises')
const path = require('path')
const shelljs = require('shelljs')

const regex = {
   require: /(require.*['"])(\.\/base)(['"]\))/g,
   import: /(import.*\bfrom\b.*['"])(\.\/base)(['"])/g,
   declarationImport:
      /((?:import|export).*\bfrom\b.*['"]\S+)(\.(?:js|cjs))(['"])/g,
}

/** @param {string} arg */
const isArg = (arg) => process.argv.includes(arg)

main()

function main() {
   // if (isArg('--to-cjs')) {
   //    // return convertToCJS()
   // }
   if (isArg('--fix-ext')) {
      return fixImportExtensions()
   }
   if (isArg('--downlevel')) {
      return void downlevel(isArg('--ts5'))
   }
   throw new Error('No helper specified.')
}

/**
 * Converts relative imports without an extension to the correct extension.
 */
function fixImportExtensions() {
   const files = shelljs.find(
      'dist/**/*.js',
      'dist/**/*.mjs'
   )

   files.forEach((file) => {
      const replaceExt = file.endsWith('.mjs')
         ? '.mjs'
         : file.endsWith('.esm.js')
         ? '.esm.js'
         : file.endsWith('.js')
         ? '.js'
         : null
      if (!replaceExt) { return }

      const isRequire = replaceExt === '.js'
      shelljs.sed(
         '-i',
         isRequire ? regex.require : regex.import,
         `$1./base${replaceExt}$3`,
         file
      )
   })
}

/**
 * Searches for "indicator" comments in declaration files and removes types
 * declared whithin their bounds.
 * @param {boolean} ts5Types Whether to use TS5.0 types.
 */
async function downlevel(ts5Types) {
   const cjsDeclarationFiles = ts5Types
      ? shelljs.find('dist/ts5.0/*.d.ts')
      : shelljs.find('dist/*.d.ts')

   await Promise.all(cjsDeclarationFiles.map(async (file) => {
      const content = await fs.readFile(file, 'utf8')
      const newContent = processContent(content, !ts5Types)

      if (!newContent) { return }

      return fs.writeFile(file, newContent, 'utf8')
   }))

   createESMDeclarations(ts5Types)
}

/**
 * Copies inital `.d.ts` declaration files, converting them to
 * `.d.mts` and `.esm.d.ts` extensions.
 *
 * @param {boolean} ts5Types Whether to use TS5.0 types.
 */
function createESMDeclarations(ts5Types) {
   const cjsDeclarationFiles = ts5Types
      ? shelljs.find('dist/ts5.0/*.d.ts')
      : shelljs.find('dist/*.d.ts')

   cjsDeclarationFiles.forEach((file) => {
      const dir = path.dirname(file)
      const fileName = path.basename(file).slice(0, -5)

      /**
       * CJS and ESM entrypoints each need their own declaration file.
       * See - https://www.typescriptlang.org/docs/handbook/esm-node.html#packagejson-exports-imports-and-self-referencing:~:text=each%20needs%20its%20own%20declaration
       */
      const exts = [`esm.d.ts`, `d.mts`]

      exts.forEach((ext) => {
         shelljs.cp('-R', file, path.join(dir, `esm/${fileName}.${ext}`))
      })
   })

   const esmDeclarationFiles = ts5Types
      ? shelljs.find(
         'dist/ts5.0/esm/*.esm.d.ts',
         'dist/ts5.0/esm/*.d.mts'
      )
      : shelljs.find(
         'dist/esm/*.esm.d.ts',
         'dist/esm/*.d.mts'
      )

   esmDeclarationFiles.forEach((file) => {
      const replaceExt = file.endsWith('.d.mts')
         ? '.mjs'
         : file.endsWith('.esm.d.ts')
         ? '.esm.js'
         : null
      if (!replaceExt) { return }

      shelljs.sed(
         '-i',
         regex.declarationImport,
         `$1${replaceExt}$3`,
         file
      )
   })
}

/**
 * Searches for "indicator" comments in the file content and removes them
 * along with any lines whithin their bounds.
 *
 * @param {string} content
 * @param {boolean} removeTypes
 */
function processContent(content, removeTypes) {
   const indicator = {
      start: '/**#__TS5_START__*/',
      end: '/**#__TS5_END__*/',
   }

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

/**
 * Converts inital declaration files to `.d.cts` extension.
 */
// function convertToCJS() {
//    const declarationFiles = shelljs.find('dist/**/*.d.ts')

//    declarationFiles.forEach((declarationFile) => {
//       const dir = path.dirname(declarationFile)
//       const fileName = path.basename(declarationFile).slice(0, -5)

//       // convert relative imports to `.cjs` extension
//       shelljs.sed(
//          '-i',
//          regex.declarationImport,
//          `$1.cjs$3`,
//          declarationFile
//       )
//       // convert file extension to `.d.cts`
//       shelljs.mv(
//          declarationFile,
//          path.join(dir, `${fileName}.d.cts`)
//       )
//    })
// }
