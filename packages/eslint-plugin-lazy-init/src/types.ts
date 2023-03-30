import type { TSESTree } from '@typescript-eslint/utils'

export type FunctionNode =
   | TSESTree.FunctionDeclaration
   | TSESTree.FunctionExpression
   | TSESTree.ArrowFunctionExpression
