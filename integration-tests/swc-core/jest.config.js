/** @type {import('jest').Config} */
const config = {
   displayName: 'integration-swc-core',
   testEnvironment: 'node',
   testMatch: ['**/dist/**/*.spec.[jt]s?(x)'],
}

module.exports = config
