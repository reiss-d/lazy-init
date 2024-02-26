import { ESLintUtils } from '@typescript-eslint/utils'
import * as path from 'path'

function getFixturesRootDir(): string {
   return path.join(__dirname, 'fixtures')
}

const { RuleTester } = ESLintUtils
export { getFixturesRootDir, RuleTester }
