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
 * If you use a version in a range of the title, the Wasm plugin will work for the runtimes written in the body.
 *
 * ## v0.76.0 ~
 * `@swc/core@1.3.58 ~`
 *
 * ## v0.75.x
 * `@swc/core@1.3.49-1.3.57`
 * `next@13.3.1-canary.12 ~`
 */
export type CoreVersions = 'v075' | 'v076'
