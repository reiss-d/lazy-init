// @ts-check

/** @type {import('jest').Config} */
const config = {
   displayName: 'lazy-init',
   testEnvironment: 'node',
   testMatch: ['**/tests/**/*.spec.[jt]s?(x)'],
   transform: {
      '^.+\\.tsx?$': ['@swc/jest', {
         jsc: {
            target: 'es2020',
            parser: { 'syntax': 'typescript' },
            experimental: {
               plugins: [
                  ['@lazy-init/plugin-swc-v83', {}],
               ],
            },
         },
      }],
   },
   // since the actual package.json is in dist (publishConfig.directory)
   // we need to ignore the root package.json so jest doesn't complain
   modulePathIgnorePatterns: ['<rootDir>/package.json'],
}

module.exports = config
