/** @type {import('jest').Config} */
const config = {
   displayName: 'integration-tsup',
   testEnvironment: 'node',
   testMatch: ['**/dist/**/*.spec.[jt]s?(x)'],
}

module.exports = config
