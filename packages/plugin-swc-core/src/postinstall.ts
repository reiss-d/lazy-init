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

      // TODO: implement `v0724`
      // TODO: change `v069` to `v069_723`
      // if (check('>= 1.3.44')) { return 'v0724' }
      // if (check('>= 1.3.40 <= 1.3.42')) { return 'v069_723' }

      if (check('>= 1.3.43')) { return unsupported() }
      if (check('>= 1.3.40 <= 1.3.42')) { return 'v069' }
      if (check('1.3.38')) { return 'v061_64' }
      if (check('>= 1.3.29 <= 1.3.37')) { return 'v054_59' }

      return unsupported()
   })
}
