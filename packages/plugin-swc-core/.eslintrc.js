const path = require('path')
const project = path.join(__dirname, './tsconfig.json')

module.exports = {
   root: true,
   extends: ['internal-base'],
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
   rules: {
      '@typescript-eslint/no-var-requires': 'off',
   },
}
