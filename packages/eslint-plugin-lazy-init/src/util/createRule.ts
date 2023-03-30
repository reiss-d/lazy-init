import { ESLintUtils } from '@typescript-eslint/utils'

export const createTsRule = ESLintUtils.RuleCreator(
   (name) => `https://typescript-eslint.io/rules/${name}`
)

export const createRule = (name: string) =>
   ESLintUtils.RuleCreator(
      (_) => `https://eslint.org/docs/rules/${name}`
   )
