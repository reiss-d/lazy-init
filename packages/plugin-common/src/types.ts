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

export type CoreVersions = 'v069' | 'v061_64' | 'v054_59'
