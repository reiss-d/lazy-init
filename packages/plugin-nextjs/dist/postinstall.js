"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const semver_1 = require("semver");
const plugin_common_1 = require("@lazy-init/plugin-common");
postInstall();
function postInstall() {
    // assertions require explicit type annotation
    const utils = (0, plugin_common_1.createUtils)('nextjs');
    (0, plugin_common_1.copyPlugin)('nextjs', __dirname, (version) => {
        const check = (range) => (0, semver_1.satisfies)(version, range);
        const unsupported = () => utils.logger.throw(`Unsupported Next.js version: ${version}`);
        if (check('>= 13.3.1-canary.12')) {
            return 'v075';
        }
        if (check('>= 13.1.4 <= 13.2.3')) {
            return utils.downgrade(version, '2.2.0');
        }
        return unsupported();
    });
}
