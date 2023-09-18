# lazy-init

Lazily initialize values by deferring their creation until first use, resulting in better performance.

## Index

- [Overview](#overview)
- [Installation](#installation)
  - [Next.js](#next-js-setup)
  - [SWC](#swc-setup)
  - [Eslint](#eslint-setup)
- [Basic Usage](#basic-usage)
- [Methods](#methods)
  - [lz](#methods)
  - [lazyFn](#methods)
  - [lazyAsync](#methods)
- [Caching](#caching)
- [Freezing](#freezing)
- [License](#license)

<!-- * [FAQ](#faq) -->
<!-- * [Benchmarks](#benchmarks) -->

## Installation

This library **requires** your code is transpilied with [SWC](https://swc.rs).

- If you are using [Next.js](#https://nextjs.org/docs/advanced-features/compiler), this is the default compiler since `v12`.<br>
- Otherwise, if your project is not yet configured to use [SWC](https://swc.rs), see [SWC - Getting Started](#https://swc.rs/docs/getting-started).

> Support for esbuild may be added in the future.

<h3 id="next-js-setup">Next.js</h3>

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

<h3 id="swc-setup">SWC - @swc/core</h3>

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

<h3 id="eslint-setup">Eslint</h3>

This step is only necessary if you are using [@typescript-eslint](#https://typescript-eslint.io/) and your configuration extends rules that [require type checking](#https://typescript-eslint.io/linting/typed-linting).

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

See [license](./LICENSE).

---
