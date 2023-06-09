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

      if (check('>= 13.4.3-canary.2')) { return 'v076' }
      if (check('>= 13.3.1-canary.12 <= 13.4.3-canary.1')) { return 'v075' }
      if (check('>= 13.1.4 <= 13.2.3')) {
         return utils.downgrade(version, '2.2.0')
      }
      return unsupported()
   })
}
