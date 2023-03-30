import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { ASTUtils, ESLintUtils } from '@typescript-eslint/utils'
import type { FunctionNode } from '../types'

// https://github.com/eslint/eslint/blob/03a69dbe86d5b5768a310105416ae726822e3c1c/lib/rules/utils/ast-utils.js#L382-L392
/**
 * Gets the `(` token of the given function node.
 */
export function getOpeningParenOfParams(
   node: FunctionNode,
   sourceCode: TSESLint.SourceCode
): TSESTree.Token {
   return ESLintUtils.nullThrows(
      node.id
         ? sourceCode.getTokenAfter(node.id, ASTUtils.isOpeningParenToken)
         : sourceCode.getFirstToken(node, ASTUtils.isOpeningParenToken),
      ESLintUtils.NullThrowsReasons.MissingToken('(', node.type)
   )
}
