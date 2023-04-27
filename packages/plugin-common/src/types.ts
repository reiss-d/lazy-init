export type Targets = 'nextjs' | 'swc-core'

export interface Utils {
   assert: (check: boolean, message: string) => asserts check
   logger: {
      dev(message: string): void
      info(message: string): void
      error(message: string): void
      throw(message: string): never
   }
   downgrade: Downgrade
}

export type GetCoreVersion = (targetVersion: string) => CoreVersions

export type Downgrade = (
   targetVer: string,
   compatPluginVer: string,
   compatLibVer?: string
) => never

/**
 * @link https://swc.rs/docs/plugin/selecting-swc-core
 *
 * swc_core
 * If you use a version in a range of the title, the Wasm plugin will work for the runtimes written in the body.
 *
 * ## v0.75.0 ~
 * `@swc/core@1.3.49 ~`
 * `next@13.3.1-canary.12 ~`
 *
 * ## v0.72.4 - v0.74.6
 * `@swc/core@1.3.44 - @swc/core@1.3.47`
 *
 * ## v0.69.x - v0.72.3
 * `@swc/core@1.3.40 - @swc/core@1.3.42`
 * `next@13.2.5-canary.5`
 *
 * ## v0.66.x - v0.68.x
 * `@swc/core@1.3.39`
 *
 * ## v0.61.x - v0.64.x
 * `@swc/core@1.3.38`
 *
 * ## v0.54.x - v0.59.x
 * `@swc/core@1.3.29 - @swc/core@1.3.37`
 * `next@13.2.4-canary.0~`
 */
export type CoreVersions = 'v075'
