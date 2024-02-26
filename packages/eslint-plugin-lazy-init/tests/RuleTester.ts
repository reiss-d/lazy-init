import * as path from 'path'
import { RuleTester } from '@typescript-eslint/rule-tester'

function getFixturesRootDir(): string {
   return path.join(__dirname, 'fixtures')
}

export { getFixturesRootDir, RuleTester }
