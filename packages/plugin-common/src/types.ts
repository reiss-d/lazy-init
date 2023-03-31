export type Targets = 'nextjs' | 'swc-core'

export interface Utils {
   assert: (check: boolean, message: string) => asserts check
   logger: {
      dev(message: string): void
      info(message: string): void
      error(message: string): void
      throw(message: string): never
   }
}

export type GetCoreVersion = (targetVersion: string) => CoreVersions

/**
 * @link https://swc.rs/docs/plugin/selecting-swc-core
 *
 * swc_core
 * If you use a version in a range of the title, the Wasm plugin will work for the runtimes written in the body.
 *
 * ## v0.72.4 ~
 * `swc/core@1.3.44 ~`
 *
 * ## v0.69.x - v0.72.3
 * `swc/core@1.3.40 - swc/core@1.3.42`
 * `next@13.2.5-canary.5`
 *
 * ## v0.66.x - v0.68.x
 * `swc/core@1.3.39`
 *
 * ## v0.61.x - v0.64.x
 * `swc/core@1.3.38`
 *
 * ## v0.54.x - v0.59.x
 * `swc/core@1.3.29 - swc/core@1.3.37`
 * `next@13.2.4-canary.0~`
 */
export type CoreVersions = 'v069' | 'v061_64' | 'v054_59'
