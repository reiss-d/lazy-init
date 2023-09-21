/** @type {import('jest').Config} */
const config = {
   displayName: 'integration-esbuild',
   testEnvironment: 'node',
   testMatch: ['**/dist/**/*.spec.[jt]s?(x)'],
}

module.exports = config
