import type { Targets, Utils } from './types'

export const createUtils = (target: Targets): Utils => {
   const prefixLog = (message: string) =>
      `[@lazy-init/${target}-plugin] ${message}`

   const logger = {
      dev(message: string) {
         // eslint-disable-next-line turbo/no-undeclared-env-vars
         if (process.env.LOG_SWC_PLUGIN_POST_INSTALL === 'true') {
            console.info(prefixLog(message))
         }
      },
      info(message: string) {
         console.info(prefixLog(message))
      },
      error(message: string) {
         console.error(prefixLog(message))
      },
      throw(message: string) {
         logger.error(message)
         throw new Error(message)
      },
   }

   return {
      logger,
      assert: (check, message) => {
         if (check) { return }
         logger.error(message)
         throw new Error(message)
      },
      downgrade: (
         targetVer,
         compatPluginVer,
         compatLibVer = compatPluginVer
      ) =>
         logger.throw(
            `${
               getTargetPkgName(target, true)
            } version "${targetVer}" requires older versions of lazy-init.` +
               `\n` +
               `  @lazy-init/nextjs-plugin@${compatPluginVer}` +
               `\n` +
               `  lazy-init@${compatLibVer}`
         ),
   }
}

export const getTargetPkgName = (target: Targets, fullname?: boolean) => {
   if (target === 'nextjs') { return fullname ? 'Next.js' : 'next' }
   if (target === 'swc-core') { return '@swc/core' }
   // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
   throw new Error(`Invalid target: ${target}`)
}
