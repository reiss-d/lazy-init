import { satisfies } from 'semver'
import {
   CoreVersions,
   type Utils,
   copyPlugin,
   createUtils,
} from 'plugin-common'

postInstall()

function postInstall() {
   // assertions require explicit type annotation
   const utils: Utils = createUtils('nextjs')

   // [>= 13.2.5-canary.5  swc_core 0.69.6]  => [v069]
   // [>= 13.2.4           swc_core 0.59.26] => [v054_59]
   // [>= 13.1.4           swc_core 0.56.0]  => [v054_59]

   copyPlugin('nextjs', __dirname, (nextVersion) => {
      const check = (range: string) => satisfies(nextVersion, range)
      const unsupported = () =>
         utils.logger.throw(`Unsupported Next.js version: ${nextVersion}`)

      if (check('>= 13.2.5-canary.5')) { return 'v069' }
      if (check('>= 13.1.4')) { return 'v054_59' }

      return unsupported()
   })
}
