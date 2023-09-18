/**
 * No longer in use.
 *
 * This file is mainly used to make sure types work on older versions of TS,
 * however, it made sense to do this when we needed to downlevel our types.
 * Now that we don't need to do that, this test is not necessary.
 * Leaving it here for now, in case we need it in the future.
 */

// @ts-check
const path = require('path')
const shelljs = require('shelljs')

const resolutions = ['node', 'node16', 'nodenext']
const isSwcCore = () => process.argv.includes('--swc-core')

main()

function main() {
   resolutions.forEach((resolution) => {
      updateResolution(resolution)
      isSwcCore() && updateOutDir(resolution)

      console.log('Building with:', { moduleResolution: resolution })

      const buildResult = build(resolution)

      if (buildResult.code !== 0) {
         reset()
         throwError('Failed to build.', buildResult, resolution)
      }
   })
   reset()
}

function reset() {
   const resolution = resolutions[0]

   updateResolution(resolution)
   isSwcCore() && updateOutDir(resolution)
}

/**
 * @param {RegExp} searchRegex
 * @param {string} replacement
 */
function editTsConfig(searchRegex, replacement) {
   return shelljs.sed(
      '-i',
      searchRegex,
      replacement,
      path.join(process.cwd(), 'tsconfig.json')
   )
}

/**
 * @param {string} resolution
 */
function updateResolution(resolution) {
   const result = editTsConfig(
      // /"moduleResolution": "(node|node16|nodenext)",/g,
      /"moduleResolution": ".*",/g,
      `"moduleResolution": "${resolution}",`
   )
   if (result.code !== 0) {
      throwError('Failed to update moduleResolution.', result, resolution)
   }
}

/**
 * @param {string} resolution
 */
function updateOutDir(resolution) {
   const result = editTsConfig(
      /"outDir": ".*",/g,
      `"outDir": "dist/${resolution}",`
   )
   if (result.code !== 0) {
      throwError('Failed to update outDir.', result, resolution)
   }
}

/**
 * @param {string} resolution
 */
function build(resolution) {
   if (!isSwcCore()) {
      return shelljs.exec('pnpm next build')
   }

   const emit = 'tsc --emitDeclarationOnly --declaration'
   const transpile = 'swc src -s false --config-file .swcrc'
   const dist = `dist/${resolution}`

   return shelljs.exec(
      `shx rm -rf ${dist} && concurrently \"pnpm ${transpile} -d ${dist}/common\" \"pnpm ${transpile} -d ${dist}/esm -C module.type=es6\" \"pnpm ${emit}\"`
   )
}

/**
 * @param {string} msg
 * @param {shelljs.ShellString} result
 * @param {string} resolution
 */
function throwError(msg, result, resolution) {
   console.error({
      typescript: getTsDependancyVersion(),
      moduleResolution: resolution,
      error: msg,
   })
   throw new Error(result.stderr || result.stdout)
}

function getTsDependancyVersion() {
   const packageJson = require(path.join(process.cwd(), 'package.json'))
   const tsVersion = packageJson.devDependencies.typescript
   return tsVersion
}
