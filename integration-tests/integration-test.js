// @ts-check
const path = require('path')
const shelljs = require('shelljs')

const resolutions = ['node', 'node16', 'nodenext', 'node']
const isSwcCore = () => process.argv.includes('--swc-core')

main()

function main() {
   const lastIdx = resolutions.length - 1

   resolutions.forEach((resolution, idx) => {
      updateResolution(resolution)
      isSwcCore() && updateOutDir(resolution)

      // last iteration is to reset back to default
      if (idx === lastIdx) { return }

      console.log('Building with:', { moduleResolution: resolution })

      const buildResult = build(resolution)

      if (buildResult.code !== 0) {
         throwError('Failed to build.', buildResult, resolution)
      }
   })
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
