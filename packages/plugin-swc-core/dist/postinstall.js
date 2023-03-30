"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const semver_1 = require("semver");
const plugin_common_1 = require("@lazy-init/plugin-common");
postInstall();
function postInstall() {
    // assertions require explicit type annotation
    const utils = (0, plugin_common_1.createUtils)('swc-core');
    // >= 1.3.40 => [v069]
    // >= 1.3.39 => [v066_68] unsupported
    // >= 1.3.38 => [v061_64]
    // >= 1.3.29 => [v054_59]
    (0, plugin_common_1.copyPlugin)('swc-core', __dirname, (version) => {
        const check = (range) => (0, semver_1.satisfies)(version, range);
        const unsupported = () => utils.logger.throw(`Unsupported @swc/core version: ${version}`);
        if (check('>= 1.3.40')) {
            return 'v069';
        }
        if (check('1.3.39')) {
            return unsupported();
        }
        if (check('1.3.38')) {
            return 'v061_64';
        }
        if (check('>= 1.3.29')) {
            return 'v054_59';
        }
        return unsupported();
    });
}
