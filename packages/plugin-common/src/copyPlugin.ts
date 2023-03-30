import path from 'path'
import { cp } from 'shelljs'
import { createUtils } from './utils'
import type { GetCoreVersion, Targets, Utils } from './types'

const getTargetPkgName = (target: Targets) => {
   if (target === 'nextjs') { return 'next' }
   if (target === 'swc-core') { return '@swc/core' }
   // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
   throw new Error(`Invalid target: ${target}`)
}

const shouldSkip = () => {
   try {
      // eslint-disable-next-line turbo/no-undeclared-env-vars
      const { INIT_CWD } = process.env

      let name: string | undefined
      try {
         name = (require(
            path.resolve(INIT_CWD!, 'package.json')
         ) as { name: string | undefined }).name
      } catch {
         //
      }

      // check if we are running in this monorepo
      if (name === 'lazy-init-repo') {
         if (process.env.NODE_ENV !== 'development') {
            // not in development, skip postinstall
            return true
         }
      }
   } catch {
      //
   }
   /**
    * we are either:
    * - running in this monorepo in development (testing)
    * - being run by the plugin consumer
    * continue postinstall
    */
   return false
}

export const copyPlugin = (
   target: Targets,
   dirname: string,
   getCoreVersion: GetCoreVersion
) => {
   // assertions require explicit type annotation
   const utils: Utils = createUtils(target)
   const { logger } = utils

   if (shouldSkip()) {
      return utils.logger.dev(`Skipping postinstall for target "${target}".`)
   }
   logger.dev(`Running postinstall for target "${target}".`)

   try {
      const targetName = getTargetPkgName(target)
      const targetPath = require.resolve(`${targetName}/package.json`)
      let targetVersion: string | undefined

      utils.assert(
         !!targetPath,
         `Peer dependency "${targetName}" not found.`
      )
      logger.dev(`Peer dependency "${targetName}" found:`)
      logger.dev(targetPath)

      try {
         targetVersion = (
            require(targetPath) as { version: string | undefined }
         ).version
      } catch {
         //
      }
      utils.assert(
         !!targetVersion,
         `Failed to determine version of "${targetName}" package.`
      )
      logger.dev(`Target is "${targetName}" at version "${targetVersion}".`)

      const coreVersion = getCoreVersion(targetVersion)
      const pluginPath = path.join(
         dirname,
         `swc_plugin_lazy_init_${coreVersion}.wasm`
      )
      const dest = path.join(
         dirname,
         'swc_plugin_lazy_init.wasm'
      )

      logger.dev(`Copying plugin with core version: "${coreVersion}".`)

      cp(pluginPath, dest)

      logger.dev(`Successfully copied plugin for target "${target}".`)
   } catch (_) {
      logger.error(`Installation failed.`)
   }
}
