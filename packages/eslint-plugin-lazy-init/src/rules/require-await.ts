/**
 * This file contains modified code from the `typescript-eslint` package.
 *
 * Source:
 * https://github.com/typescript-eslint/typescript-eslint/blob/ba2f0c5d82a10222a5de9d57cbe8a0722f18ca46/packages/eslint-plugin/src/rules/require-await.ts
 *
 * License:
 * MIT License
 *
 * Copyright (c) 2019 typescript-eslint and other contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import type * as ts from 'typescript'
import * as tsutils from 'tsutils'
import {
   ASTUtils,
   AST_NODE_TYPES,
   ESLintUtils,
   type TSESTree,
} from '@typescript-eslint/utils'
import type { FunctionNode } from '../types'
import {
   createTsRule,
   expandUnionOrIntersectionType,
   getFunctionHeadLoc,
   isEmptyFunction,
   upperCaseFirst,
} from '../util'

interface ScopeInfo {
   upper: ScopeInfo | null
   hasAwait: boolean
   hasAsync: boolean
   isGen: boolean
   isAsyncYield: boolean
}

export default createTsRule({
   name: 'require-await',
   meta: {
      type: 'suggestion',
      docs: {
         description:
            'Disallow async functions which have no `await` expression',
         recommended: 'recommended',
         requiresTypeChecking: true,
         extendsBaseRule: true,
      },
      schema: [],
      messages: {
         missingAwait: "{{name}} has no 'await' expression.",
      },
   },
   defaultOptions: [],
   create(context) {
      const parserServices = ESLintUtils.getParserServices(context)
      const checker = parserServices.program.getTypeChecker()
      const sourceCode = context.sourceCode
      let scopeInfo: ScopeInfo | null = null

      /**
       * Push the scope info object to the stack.
       */
      function enterFunction(node: FunctionNode): void {
         scopeInfo = {
            upper: scopeInfo,
            hasAwait: false,
            hasAsync: node.async,
            isGen: node.generator || false,
            isAsyncYield: false,
         }
      }

      /**
       * Pop the top scope info object from the stack.
       * Also, it reports the function if needed.
       */
      function exitFunction(node: FunctionNode): void {
         // this shouldn't ever happen, as we have to exit a function after we enter it
         if (!scopeInfo) { return }

         if (
            node.async &&
            !scopeInfo.hasAwait &&
            !isEmptyFunction(node) &&
            !(scopeInfo.isGen && scopeInfo.isAsyncYield)
         ) {
            context.report({
               node,
               loc: getFunctionHeadLoc(node, sourceCode),
               messageId: 'missingAwait',
               data: {
                  name: upperCaseFirst(ASTUtils.getFunctionNameWithKind(node)),
               },
            })
         }

         scopeInfo = scopeInfo.upper
      }

      /**
       * Checks if the node returns a thenable type
       */
      function isThenableType(node: ts.Node): boolean {
         const type = checker.getTypeAtLocation(node)

         return tsutils.isThenableType(checker, node, type)
      }

      /**
       * Marks the current scope as having an await
       */
      function markAsHasAwait(): void {
         if (!scopeInfo) { return }
         scopeInfo.hasAwait = true
      }

      /**
       * mark `scopeInfo.isAsyncYield` to `true` if its a generator
       * function and the delegate is `true`
       */
      function markAsHasDelegateGen(node: TSESTree.YieldExpression): void {
         if (!scopeInfo?.isGen || !node.argument) {
            return
         }

         if (node?.argument?.type === AST_NODE_TYPES.Literal) {
            // making this `false` as for literals we don't need to check the definition
            // eg : async function* run() { yield* 1 }
            scopeInfo.isAsyncYield ||= false
         }

         const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node?.argument)
         const type = checker.getTypeAtLocation(tsNode)
         const typesToCheck = expandUnionOrIntersectionType(type)
         for (const type of typesToCheck) {
            const asyncIterator = tsutils.getWellKnownSymbolPropertyOfType(
               type,
               'asyncIterator',
               checker
            )
            if (asyncIterator !== undefined) {
               scopeInfo.isAsyncYield = true
               break
            }
         }
      }

      function enterCallExpression(node: TSESTree.CallExpression): void {
         // short circuit early to avoid unnecessary checks
         if (!scopeInfo || !scopeInfo.hasAsync || scopeInfo.hasAwait) {
            return
         }
         if (node.callee.type === AST_NODE_TYPES.MemberExpression) {
            const { object, property } = node.callee

            if (
               object.type === AST_NODE_TYPES.Identifier &&
               (object.name === 'lz' || object.name === 'lazy') &&
               property.type === AST_NODE_TYPES.Identifier &&
               property.name === 'async'
            ) {
               markAsHasAwait()
            }
         }
      }

      return {
         FunctionDeclaration: enterFunction,
         FunctionExpression: enterFunction,
         ArrowFunctionExpression: enterFunction,
         'FunctionDeclaration:exit': exitFunction,
         'FunctionExpression:exit': exitFunction,
         'ArrowFunctionExpression:exit': exitFunction,

         'CallExpression': enterCallExpression,

         AwaitExpression: markAsHasAwait,
         'ForOfStatement[await = true]': markAsHasAwait,
         'YieldExpression[delegate = true]': markAsHasDelegateGen,

         // check body-less async arrow function.
         // ignore `async () => await foo` because it's obviously correct
         'ArrowFunctionExpression[async = true] > :not(BlockStatement, AwaitExpression)'(
            node: Exclude<
               TSESTree.Node,
               TSESTree.BlockStatement | TSESTree.AwaitExpression
            >
         ): void {
            const expression = parserServices.esTreeNodeToTSNodeMap.get(node)
            if (expression && isThenableType(expression)) {
               markAsHasAwait()
            }
         },
         ReturnStatement(node): void {
            // short circuit early to avoid unnecessary type checks
            if (!scopeInfo || scopeInfo.hasAwait || !scopeInfo.hasAsync) {
               return
            }

            const { expression } = parserServices.esTreeNodeToTSNodeMap.get(
               node
            )
            if (expression && isThenableType(expression)) {
               markAsHasAwait()
            }
         },
      }
   },
})
