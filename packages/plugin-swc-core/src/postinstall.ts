import { satisfies } from 'semver'
import { type Utils, copyPlugin, createUtils } from '@lazy-init/plugin-common'

postInstall()

function postInstall() {
   // assertions require explicit type annotation
   const utils: Utils = createUtils('swc-core')

   copyPlugin('swc-core', __dirname, (version) => {
      const check = (range: string) => satisfies(version, range)
      const unsupported = () =>
         utils.logger.throw(`Unsupported @swc/core version: ${version}`)

      if (check('>= 1.3.58')) { return 'v076' }
      if (check('>= 1.3.49 <= 1.3.57')) { return 'v075' }
      if (check('>= 1.3.40 <= 1.3.42')) {
         return utils.downgrade(version, '2.2.0')
      }
      if (check('1.3.38')) {
         return utils.downgrade(version, '2.2.0')
      }
      if (check('>= 1.3.29 <= 1.3.37')) {
         return utils.downgrade(version, '2.2.0')
      }
      return unsupported()
   })
}
