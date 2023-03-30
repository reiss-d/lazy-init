// modified from - https://github.com/typescript-eslint/typescript-eslint/blob/ba2f0c5d82a10222a5de9d57cbe8a0722f18ca46/packages/eslint-plugin/src/rules/require-await.ts
import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { ASTUtils, AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils'
import type { FunctionNode } from '../types'
import { getOpeningParenOfParams } from './getOpeningParenOfParams'

// https://github.com/eslint/eslint/blob/03a69dbe86d5b5768a310105416ae726822e3c1c/lib/rules/utils/ast-utils.js#L1220-L1242
/**
 * Gets the location of the given function node for reporting.
 */
export function getFunctionHeadLoc(
   node: FunctionNode,
   sourceCode: TSESLint.SourceCode
): TSESTree.SourceLocation {
   const parent = ESLintUtils.nullThrows(
      node.parent,
      ESLintUtils.NullThrowsReasons.MissingParent
   )
   let start: any = null
   let end: any = null

   if (node.type === AST_NODE_TYPES.ArrowFunctionExpression) {
      const arrowToken = ESLintUtils.nullThrows(
         sourceCode.getTokenBefore(node.body, ASTUtils.isArrowToken),
         ESLintUtils.NullThrowsReasons.MissingToken('=>', node.type)
      )

      start = arrowToken.loc.start
      end = arrowToken.loc.end
   } else if (
      parent.type === AST_NODE_TYPES.Property ||
      parent.type === AST_NODE_TYPES.MethodDefinition
   ) {
      start = parent.loc.start
      end = getOpeningParenOfParams(node, sourceCode).loc.start
   } else {
      start = node.loc.start
      end = getOpeningParenOfParams(node, sourceCode).loc.start
   }

   return {
      start,
      end,
   }
}
