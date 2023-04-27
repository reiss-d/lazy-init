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
        if (check('>= 1.3.49')) {
            return 'v075';
        }
        if (check('>= 1.3.40 <= 1.3.42')) {
            return utils.downgrade(version, '2.2.0');
        }
        if (check('1.3.38')) {
            return utils.downgrade(version, '2.2.0');
        }
        if (check('>= 1.3.29 <= 1.3.37')) {
            return utils.downgrade(version, '2.2.0');
        }
        return unsupported();
    });
}
