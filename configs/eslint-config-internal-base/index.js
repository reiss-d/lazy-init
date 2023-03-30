module.exports = {
   env: { es6: true },
   extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:@typescript-eslint/recommended-requiring-type-checking',
      'plugin:import/recommended',
      'plugin:import/typescript',
      'turbo',
   ],
   plugins: ['@typescript-eslint', 'import'],
   parser: '@typescript-eslint/parser',
   settings: {
      'import/parsers': {
         '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
      'import/resolver': {
         typescript: { alwaysTryTypes: true },
      },
   },
   rules: {
      'import/no-anonymous-default-export': 'off',

      'no-unused-expressions': [
         'warn',
         { allowShortCircuit: true, allowTernary: true },
      ],
      'prefer-const': [
         'warn',
         { destructuring: 'all', ignoreReadBeforeAssign: false },
      ],
      'no-void': 0,
      'no-inner-declarations': 0,

      '@typescript-eslint/ban-ts-comment': 0,
      '@typescript-eslint/restrict-template-expressions': [
         'error',
         { allowNumber: true },
      ],
      '@typescript-eslint/no-unused-vars': [
         'warn',
         {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
            caughtErrorsIgnorePattern: '^_',
         },
      ],
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/restrict-plus-operands': 'error',
      '@typescript-eslint/ban-types': 0,
      '@typescript-eslint/no-extra-semi': 0,
      '@typescript-eslint/no-explicit-any': 0,
      '@typescript-eslint/no-empty-interface': 0,
      '@typescript-eslint/no-empty-function': 0,
      '@typescript-eslint/no-non-null-assertion': 0,
   },
}
