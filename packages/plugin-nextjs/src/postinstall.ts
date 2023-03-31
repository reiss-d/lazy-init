import { satisfies } from 'semver'
import { type Utils, copyPlugin, createUtils } from '@lazy-init/plugin-common'

postInstall()

function postInstall() {
   // assertions require explicit type annotation
   const utils: Utils = createUtils('nextjs')

   copyPlugin('nextjs', __dirname, (version) => {
      const check = (range: string) => satisfies(version, range)
      const unsupported = () =>
         utils.logger.throw(`Unsupported Next.js version: ${version}`)

      // if (check('>= 13.2.5-canary.5')) { return 'v069' }
      if (check('>= 13.1.4 <= 13.2.3')) { return 'v054_59' }

      return unsupported()
   })
}
