const path = require('path')
const project = path.join(__dirname, './tsconfig.json')

module.exports = {
   root: true,
   env: { node: true },
   extends: ['internal-ts'],
   parserOptions: {
      project,
   },
   settings: {
      'import/resolver': {
         typescript: {
            alwaysTryTypes: true,
            project,
         },
      },
   },
   rules: {},
}
