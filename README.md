# lazy-init

Lazily initialize values by deferring their creation until first use, resulting in better performance.

### Now also bringing block expressions to JavaScript/TypeScript.

## Index

<!-- TODO: add Plugin Config section. -->

- [Overview](#overview)
- [Installation](#installation)
  - [Next.js](#nextjs)
  - [SWC](#swc---swccore)
  - [esbuild](#eslint)
  - [tsup](#tsup)
  - [eslint](#eslint)
- [Basic Usage](#basic-usage)
- [Methods](#methods)
  - [block](#methods)
  - [lz](#methods)
  - [lazyFn](#methods)
  - [lazyAsync](#methods)
- [Caching](#caching)
- [Freezing](#freezing)
- [License](#license)

<!-- * [FAQ](#faq) -->
<!-- * [Benchmarks](#benchmarks) -->

## Installation

This library **requires** your code is transpilied with any of the following:

- [SWC](https://swc.rs) (includes [Next.js](https://nextjs.org/docs/advanced-features/compiler))
- [esbuild](https://github.com/evanw/esbuild)
- [tsup](https://github.com/egoist/tsup)

If you require a version of next/swc unsupported by the plugin and it is listed [here](https://swc.rs/docs/plugin/selecting-swc-core),
create an issue requesting support.

### Next.js

| Version                 |           Plugin            |
| :---------------------- | :-------------------------: |
| `>= v13.4.20-canary.32` | `@lazy-init/plugin-swc-v83` |
| `>= v13.4.10-canary.1`  | `@lazy-init/plugin-swc-v81` |

<!-- > Next.js v13.2.4 ~ v13.3.1 cannot execute SWC Wasm plugins, [due to a bug](https://github.com/vercel/next.js/issues/46989#issuecomment-1486989081). -->

```bash
# using npm
npm install lazy-init && npm install --save-dev @lazy-init/plugin-swc-{{version}}
# using pnpm
pnpm add lazy-init && pnpm add -D @lazy-init/plugin-swc-{{version}}
```

Add the following to your next config file:

> next.config.js

```js
module.exports = {
   experimental: {
      swcPlugins: [
         // empty config object `{}` is required.
         [require.resolve('@lazy-init/plugin-swc-{{version}}'), {}],
      ],
   },
}
```

> next.config.mjs (ESM)

```js
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)

export default {
   experimental: {
      swcPlugins: [
         // empty config object `{}` is required.
         [require.resolve('@lazy-init/plugin-swc-{{version}}'), {}],
      ],
   },
}
```

### SWC - @swc/core

| Version     |          Supported          |
| :---------- | :-------------------------: |
| `>= 1.3.81` | `@lazy-init/plugin-swc-v83` |
| `>= 1.3.68` | `@lazy-init/plugin-swc-v81` |

```bash
# using npm
npm install lazy-init && npm install --save-dev @lazy-init/plugin-swc-{{version}} 
# using pnpm
pnpm add lazy-init && pnpm add -D @lazy-init/plugin-swc-{{version}}
```

The empty config object `{}` is required.

```json
// .swcrc
{
   "jsc": {
      "experimental": {
         "plugins": [
            ["@lazy-init/plugin-swc-{{version}}", {}]
         ]
      }
   }
}
```

### esbuild

<!-- TODO: document bundle performance impact of esbuild/tsup plugin -->

| Version              |          Supported          |
| :------------------- | :-------------------------: |
| `0.18.x \|\| 0.19.x` | `@lazy-init/esbuild-plugin` |

```bash
# using npm
npm install lazy-init && npm install --save-dev @lazy-init/esbuild-plugin
# using pnpm
pnpm add lazy-init && pnpm add -D @lazy-init/esbuild-plugin
```

The `include` and `exclude` properties are glob arrays which follow the same
behaviour as [include](https://www.typescriptlang.org/tsconfig#include) and
[exclude](https://www.typescriptlang.org/tsconfig#exclude) in Typescripts `tsconfig.json`.

These options are not required. However, providing either will improve performance.

By default, imports from `node_modules` will be skipped by this plugin unless
`excludeNodeModules` is set to `false`.

```js
// your build file
const { lazyInitPlugin } = require('@lazy-init/esbuild-plugin')
const esbuild = require('esbuild')

esbuild.build({
   // ... other options
   plugins: [
      // If you are using plugins that transform paths, place them first.
      lazyInitPlugin({
         include: ['src'],
         exclude: ['src/**/*.test.ts'],
         excludeNodeModules: true, // default
      }),
   ],
})
```

### tsup

tsup uses esbuild internally, therefore everything documented in the
[esbuild section](#esbuild) applies here. The only difference
is a slight change in the configuration.

| Version    |          Supported          |
| :--------- | :-------------------------: |
| `>= 7.x.x` | `@lazy-init/esbuild-plugin` |

> Note: just copy the `include` and `exclude` arrays from your `tsconfig.json`.

```ts
// tsup.config.ts
import { lazyInitPlugin } from '@lazy-init/esbuild-plugin'
import { defineConfig } from 'tsup'

export default defineConfig({
   // ... other options
   esbuildPlugins: [
      // If you are using plugins that transform paths, place them first.
      lazyInitPlugin({
         include: ['src'],
         exclude: ['src/**/*.test.ts'],
         excludeNodeModules: true, // default
      }),
   ],
})
```

### eslint

This step is only necessary if you are planning on using the `lz.async` method
and have [@typescript-eslint](#https://typescript-eslint.io/) with rules
that [require type checking](#https://typescript-eslint.io/linting/typed-linting).

```bash
# using npm
npm install --save-dev eslint-plugin-lazy-init 
# using pnpm
pnpm add -D eslint-plugin-lazy-init
```

```js
// .eslintrc.js
module.exports = {
  extends: {
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    // must come after
    'plugin:lazy-init/recommended'
  }
}
```

## Basic Usage

For more in-depth examples, see the per method [documentation](#methods).

```ts
import { lz, lzc } from 'lazy-init' // ESM
const { lz, lzc } = require('lazy-init') // Common JS

// call `lz` for non-primitive values
lz({ foo: 1 })
lz([1, 2, 3])
lz(new Map([['key', 'value']]))

// call `lz.fn` for sync functions
lz.fn(() => {})

// call `lz.async` for async functions
lz.async(async () => {})

// call `lzc` to cache by default
const first = lzc({ a: 'foo' })
const second = lzc({ a: 'foo' })

console.log(first === second) // true
```

## Methods

Click the method to see its documentation:

- [`block`](https://github.com/reiss-d/lazy-init/blob/main/packages/lazy-init/src/methods/block/README.md)
- [`lz`](https://github.com/reiss-d/lazy-init/blob/main/packages/lazy-init/src/methods/obj/README.md)
- [`lz.fn`](https://github.com/reiss-d/lazy-init/blob/main/packages/lazy-init/src/methods/fn/README.md)
- [`lz.async`](https://github.com/reiss-d/lazy-init/blob/main/packages/lazy-init/src/methods/async/README.md)

## Caching

Caching results in only a single value ever being created for the given
value structure. This can improve performance and reduce memory usage.

Caching can be enabled by setting the `cache` property to `true` on a
options object or by using the `lzc` method where caching is enabled by
default.

```ts
// using `lz`
lz({}) // not cached
lz({}, { cache: true }) // cached

// using `lzc`
lzc({}) // cached
lzc({}, { cache: false }) // not cached
```

When caching is enabled, the value will also be frozen unless you explicitly
say otherwise. This is because caching an object that is not frozen is
dangerous.

The object may mistakenly be mutated by the user, yet other
recipients of this cached object do not expect it to change.

```ts
// using `lz`
lz({}) // N/A
lz({}, { cache: true, freeze: false }) // cached
lz({}, { cache: true }) // cached & frozen

// using `lzc`
lzc({}) // cached & frozen
lzc({}, { freeze: false }) // cached
lzc({}, { cache: false }) // N/A
```

Referentially comparing cached and non-cached values:

```ts
// `cfoo` and `cbar` share the same structure and are both
// cached, therefore they are the same object.
const cfoo = lzc({ a: 1 })
const cbar = lzc({ a: 1 })
cfoo === cbar // true
```

```ts
// `cfoo` and `buzz` share the same structure, however, `buzz`
//  is not cached, therefore they are different objects.
const buzz = lzc({ a: 1 }, { cache: false })
cfoo === buzz // false
```

```ts
// `cfoo` and `cdiff` are cached, however, they do not share the
// same structure and are therefore different objects.
const cdiff = lzc({ a: 5 })
cfoo === cdiff // false
```

There are separate caches for frozen and non-frozen objects. Therefore,
frozen and non-frozen objects with the same structure will not be the same
object.

```ts
const cfoo = lzc({ a: 1 })
const cbar = lzc({ a: 1 }, { freeze: false })
cfoo === cbar // false
```

## Freezing

By default, freezing a value will perform a deep freeze on it.

To change this behaviour, set the environment variable `LAZY_INIT_FREEZE_MODE`
to one of the following values:

- `"deep"` (default)
- `"shallow"`
- `"none"`

### Deep Freeze

The values of each key and symbol property will be recursively frozen.
However, this only applies to arrays and plain objects. Other objects such
as `Set` and `Map` will not be frozen.

```ts
const foo = lz({
   val: 'bar',
   obj: { a: 0, b: [], c: new Set() },
}, true)
foo.val = 'buzz' // error
foo.obj.a = 2 // error
foo.obj.b.push(1) // error
foo.obj.c.add(1) // ok
foo.obj.c = null // error
```

### Shallow Freeze

Only the value itself will be frozen, not any of its array/object properties.

```ts
const foo = lz({
   val: 'bar',
   obj: { a: 0 },
}, true)
foo.val = 'buzz' // error
foo.obj.a = 2 // ok
foo.obj = {} // error
```

### None

The value will not be frozen.

## License

This repository is licensed under the MIT License found [here](./LICENSE).
Each package/crate may contain a LICENSE file in its root which takes precedence
and may include or depend on third-party code with its own licensing conditions.

---
