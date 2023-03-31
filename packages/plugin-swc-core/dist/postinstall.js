"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const semver_1 = require("semver");
const plugin_common_1 = require("@lazy-init/plugin-common");
postInstall();
function postInstall() {
    // assertions require explicit type annotation
    const utils = (0, plugin_common_1.createUtils)('swc-core');
    (0, plugin_common_1.copyPlugin)('swc-core', __dirname, (version) => {
        const check = (range) => (0, semver_1.satisfies)(version, range);
        const unsupported = () => utils.logger.throw(`Unsupported @swc/core version: ${version}`);
        // TODO: implement `v0724`
        // TODO: change `v069` to `v069_723`
        // if (check('>= 1.3.44')) { return 'v0724' }
        // if (check('>= 1.3.40 <= 1.3.42')) { return 'v069_723' }
        if (check('>= 1.3.43')) {
            return unsupported();
        }
        if (check('>= 1.3.40 <= 1.3.42')) {
            return 'v069';
        }
        if (check('1.3.38')) {
            return 'v061_64';
        }
        if (check('>= 1.3.29 <= 1.3.37')) {
            return 'v054_59';
        }
        return unsupported();
    });
}
