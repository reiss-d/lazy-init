"use strict";var o=require("semver"),n=require("@lazy-init/plugin-common");i();function i(){let e=(0,n.createUtils)("swc-core");(0,n.copyPlugin)("swc-core",__dirname,r=>{let t=c=>(0,o.satisfies)(r,c),s=()=>e.logger.throw(`Unsupported @swc/core version: ${r}`);return t(">= 1.3.58")?"v076":t(">= 1.3.49 <= 1.3.57")?"v075":t(">= 1.3.40 <= 1.3.42")||t("1.3.38")||t(">= 1.3.29 <= 1.3.37")?e.downgrade(r,"2.2.0"):s()})}
