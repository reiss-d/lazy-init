// @ts-check
const { sync } = require('fast-glob')
const { join } = require('path')
const { cp, mkdir } = require('shelljs')

const files = sync(['**', '!*Options.spec.ts'], {
   cwd: join(__dirname, '../packages/lazy-init/tests'),
   absolute: true,
})

mkdir('-p', 'src')
cp('-R', files, 'src')
