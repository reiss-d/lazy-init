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

   const assert = (check: boolean, message: string): asserts check => {
      if (check) { return }
      logger.error(message)
      throw new Error(message)
   }

   return { assert, logger }
}
