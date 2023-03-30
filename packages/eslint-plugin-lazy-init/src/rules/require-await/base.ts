// // modified from - https://github.com/typescript-eslint/typescript-eslint/blob/ba2f0c5d82a10222a5de9d57cbe8a0722f18ca46/packages/eslint-plugin/src/rules/require-await.ts
// import type { TSESTree } from '@typescript-eslint/utils'
// import { ASTUtils, AST_NODE_TYPES } from '@typescript-eslint/utils'
// import type { FunctionNode } from '../../types'

// import {
//    createRule,
//    getFunctionHeadLoc,
//    isEmptyFunction,
//    upperCaseFirst,
// } from '../../util'

// interface ScopeInfo {
//    upper: ScopeInfo | null
//    hasAwait: boolean
//    hasAsync: boolean
// }

// const rule = createRule('require-await')({
//    name: 'require-await',
//    meta: {
//       type: 'suggestion',
//       docs: {
//          description:
//             'Disallow async functions which have no `await` expression',
//          recommended: 'error',
//          requiresTypeChecking: false,
//          extendsBaseRule: true,
//       },
//       schema: [],
//       messages: {
//          missingAwait: "{{name}} has no 'await' expression.",
//       },
//    },
//    defaultOptions: [],
//    create(context) {
//       const sourceCode = context.getSourceCode()
//       let scopeInfo: ScopeInfo | null = null

//       /**
//        * Push the scope info object to the stack.
//        */
//       function enterFunction(node: FunctionNode): void {
//          scopeInfo = {
//             upper: scopeInfo,
//             hasAwait: false,
//             hasAsync: node.async,
//          }
//       }

//       /**
//        * Pop the top scope info object from the stack.
//        * Also, it reports the function if needed.
//        */
//       function exitFunction(node: FunctionNode): void {
//          /* istanbul ignore if */ if (!scopeInfo) {
//             // this shouldn't ever happen, as we have to exit a function after we enter it
//             return
//          }

//          if (
//             !node.generator && node.async && !scopeInfo.hasAwait &&
//             !isEmptyFunction(node)
//          ) {
//             context.report({
//                node,
//                loc: getFunctionHeadLoc(node, sourceCode),
//                messageId: 'missingAwait',
//                data: {
//                   name: upperCaseFirst(
//                      ASTUtils.getFunctionNameWithKind(node)
//                   ),
//                },
//             })
//          }

//          scopeInfo = scopeInfo.upper
//       }

//       function enterCallExpression(node: TSESTree.CallExpression): void {
//          // short circuit early to avoid unnecessary checks
//          if (!scopeInfo || !scopeInfo.hasAsync || scopeInfo.hasAwait) {
//             return
//          }
//          if (node.callee.type === AST_NODE_TYPES.MemberExpression) {
//             const { object, property } = node.callee

//             if (
//                object.type === AST_NODE_TYPES.Identifier &&
//                (object.name === 'lz' || object.name === 'lazy') &&
//                property.type === AST_NODE_TYPES.Identifier &&
//                property.name === 'async'
//             ) {
//                markAsHasAwait()
//             }
//          }
//       }

//       /**
//        * Marks the current scope as having an await
//        */
//       function markAsHasAwait(): void {
//          if (!scopeInfo) {
//             return
//          }
//          scopeInfo.hasAwait = true
//       }

//       return {
//          FunctionDeclaration: enterFunction,
//          FunctionExpression: enterFunction,
//          ArrowFunctionExpression: enterFunction,
//          'FunctionDeclaration:exit': exitFunction,
//          'FunctionExpression:exit': exitFunction,
//          'ArrowFunctionExpression:exit': exitFunction,
//          'CallExpression': enterCallExpression,
//          AwaitExpression: markAsHasAwait,
//          ForOfStatement(node) {
//             if (node.await) {
//                markAsHasAwait()
//             }
//          },
//       }
//    },
// })

// export default rule
