const path = require('path')
const project = path.join(__dirname, './tsconfig.json')

/* eslint-disable no-undef */
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
      '@typescript-eslint/no-shadow': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
   },
}
