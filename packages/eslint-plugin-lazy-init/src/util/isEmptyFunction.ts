import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import type { FunctionNode } from '../types'

export function isEmptyFunction(node: FunctionNode): boolean {
   return (
      node.body?.type === AST_NODE_TYPES.BlockStatement &&
      node.body.body.length === 0
   )
}
