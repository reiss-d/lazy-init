// @ts-check

/** @type {import('jest').Config} */
const config = {
   displayName: 'lazy-init',
   testEnvironment: 'node',
   testMatch: ['**/tests/**/?(*.)+(spec|test).[jt]s?(x)'],
   transform: {
      '^.+\\.tsx?$': ['@swc/jest', {
         jsc: {
            target: 'es2020',
            'parser': { 'syntax': 'typescript' },
         },
      }],
   },
}

module.exports = config
