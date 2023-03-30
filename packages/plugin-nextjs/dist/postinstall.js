"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const semver_1 = require("semver");
const plugin_common_1 = require("plugin-common");
postInstall();
function postInstall() {
    // assertions require explicit type annotation
    const utils = (0, plugin_common_1.createUtils)('nextjs');
    // [>= 13.2.5-canary.5  swc_core 0.69.6]  => [v069]
    // [>= 13.2.4           swc_core 0.59.26] => [v054_59]
    // [>= 13.1.4           swc_core 0.56.0]  => [v054_59]
    (0, plugin_common_1.copyPlugin)('nextjs', __dirname, (nextVersion) => {
        const check = (range) => (0, semver_1.satisfies)(nextVersion, range);
        const unsupported = () => utils.logger.throw(`Unsupported Next.js version: ${nextVersion}`);
        if (check('>= 13.2.5-canary.5')) {
            return 'v069';
        }
        if (check('>= 13.1.4')) {
            return 'v054_59';
        }
        return unsupported();
    });
}
