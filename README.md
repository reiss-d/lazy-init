# lazy-init
Lazily initialize values by deferring their creation until first use, resulting in better performance.

## Table of contents

* [Installation](#installation)
  * [Next.js](#next-js-setup)
  * [SWC](#swc-setup)
  * [Eslint](#eslint-setup)
* [Basic Usage](#basic-usage)
* [API](#api)
  * [Methods](#methods)
    * [lz](#lz-method)
    * [lazyFn](#lz-fn-method)
    * [lazyAsync](#lz-async-method)
  * [Option Types](#option-types)
    * [LazyOptions](#lz-options)
    * [LazyFnOptions](#lz-fn-options)
    * [LazyAsyncOptions](#lz-async-options)
* [Old Versions](#old-versions)
  * [Next.js](#next-js-old-versions)
  * [SWC](#swc-old-versions)
<!-- * [FAQ](#faq) -->
<!-- * [Benchmarks](#benchmarks) -->
* [License](#license)

## Installation

This library **requires** your code is transpilied with [SWC](https://swc.rs).

* If you are using [Next.js](#https://nextjs.org/docs/advanced-features/compiler), this is the default compiler since `v12`.<br>
* Otherwise, if your project is not yet configured to use [SWC](https://swc.rs), see [SWC - Getting Started](#https://swc.rs/docs/getting-started).

> Support for babel/webpack may be added in the future.

<h3 id="next-js-setup">Next.js</h3>


|       Version        |          Supported           |
| :------------------- |:----------------------------:|
| `>= 13.3.2`          |              ✅              |
| `13.2.4 ~ 13.3.1`    |             :bug:            |
| `<= 13.2.3`          | [See](#next-js-old-versions) |


> Next.js v13.2.4 ~ v13.3.1 cannot execute SWC Wasm plugins, [due to a bug](https://github.com/vercel/next.js/issues/46989#issuecomment-1486989081).

The `next` package must be installed first and present in your `package.json` **before** installing `lazy-init`.

```bash
# using npm
npm install lazy-init && npm install --save-dev @lazy-init/nextjs-plugin
# using pnpm
pnpm add lazy-init && pnpm add -D @lazy-init/nextjs-plugin
```

Add the following to your next config file:

> next.config.js
```js
module.exports = {
  experimental: {
    swcPlugins: [
      // empty config object `{}` is required.
      [require.resolve("@lazy-init/nextjs-plugin"), {}]
    ]
  }
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
      [require.resolve("@lazy-init/nextjs-plugin"), {}]
    ]
  }
}

```


<h3 id="swc-setup">SWC - @swc/core</h3>

|       Version        |          Supported           |
| :------------------- |:----------------------------:|
| `>= 1.3.49`          |              ✅              |
| `<= 1.3.48`          |   [See](#swc-old-versions)   |


The `@swc/core` package must be installed first and present in your `package.json` **before** installing `lazy-init`.

```bash
# using npm
npm install lazy-init && npm install --save-dev @lazy-init/swc-core-plugin 
# using pnpm
pnpm add lazy-init && pnpm add -D @lazy-init/swc-core-plugin
```

The empty config object `{}` is required.

```json
// .swcrc
{
  "jsc": {
    "experimental": {
      "plugins": [
        ["@lazy-init/swc-core-plugin", {}]
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

```ts
import { lz } from "lazy-init" // ESM
const { lz } = require("lazy-init") // Common JS
```
```ts
// call `lz` for objects
lz({})
// `lz.fn` (lazyFn) for sync functions
lz.fn(() => {})
// `lz.async` (lazyAsync) for async functions
lz.async(async () => {})
```

# API

<!---------- START: lz method ---------->

## Methods

<h3 id="lz-method">lz</h3>

▸ **lz**<`T`>(`value`, `options?`): `T`

Lazily initialize an object by only creating it **once**.
The first call to `lz` will create the object and hoist
it into a lazy variable. After which the same object will
be returned without any calls to `lz`.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `T` | The object to lazily initialize. |
| `options?` | `boolean` \| [`LazyOptions`](#lz-options) | Set `true` to freeze the object, or an object with configured options. |

#### Returns

`T` - The initialized object.

**`Example`**

```ts
const foo = () => {
  const obj = lz({ a: 1 })
  return obj
}
const a = foo()
const b = foo()
a === b // true
```
#### Caching
Caching results in only a single object being created for the given object structure.

**`Example`**

```ts
  const foo = lz({ a: 1 }, { cache: true })
  const bar = lz({ a: 1 }, { cache: true })
  foo === bar // true
  const buzz = lz({ a: 1 }, { cache: false })
  foo === buzz // false
```
#### Default Caching Behavior
Import path changes the default caching behavior.

**`Example`**

```ts
// not cached by default
import { lz } from 'lazy-init'
  lz({ a: 1 }) // not cached
  lz({ b: 1 }, { cache: true }) // cached

// cached by default
import { lz } from 'lazy-init/cache'
  lz({ c: 1 }) // cached
  lz({ d: 1 }, { cache: false }) // not cached
```
#### Use Case - React Hook

**`Example`**

```ts
// `useHook` uses referential equality to compare
// it's arguments and if they have changed it will
// re-calculate the expensive value.
import { useHook } from 'some-lib'

// this component will re-run the expensive
// calculation every time it renders.
const Component = () => {
  const expensiveValue = useHook({ users: 100 })
  // ...
}
// using `lz` this component will only run the
// expensive calculation once.
const BetterComponent = () => {
  const expensiveValue = useHook(lz({ users: 100 }))
  // ...
}
```
#### Plugin Transformation
> *original code*
```ts
const foo = () => {
  const obj = lz({ a: 1 })
}
```
> *transformed code*
```ts
var lzVar; // hoisted variable
const foo = () => {
  const obj = lzVar ?? (lzVar = lz({ a: 1 }))
}
```
<!---------- END: lz method ---------->
___

<!---------- START: lazyFn method ---------->

<h3 id="lz-fn-method">lazyFn</h3>

▸ **lz.fn**<`R`\>(`fn`, `options?`): `R`

Lazily initializes the result of a function by only running it **once**.

The first call to the function will get the result and hoist it into a lazy variable.<br>
Subsequent calls will return the lazy variable.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | () => `R` | The function to be lazily initialized. |
| `options` | [`LazyFnOptions`](#lz-fn-options)<`R`\> | Optional object with configured options. |

#### Returns

`R` - The value returned by `fn`.

```ts
const foo = () => {
  const result = lz.fn(() => {
     console.log('this will only be logged once')
     return { bar: 1 }
  })
  return result // { bar: 1 }
}
const a = foo() // logs "this will only be logged once"
const b = foo() // does not log
a === b // true
```
#### Plugin Transformation
> *original code*
```ts
const foo = () => {
  const result = lz.fn(() => ({ a: 1 }))
}
```
> *transformed code*
```ts
var lzVar;
const foo = () => {
  const result = lzVar ?? (lzVar = lz.fn(() => ({ a: 1 })))
}
```
<!---------- END: lazyFn method ---------->
___

<!---------- START: lazyAsync method ---------->

<h3 id="lz-async-method">lazyAsync</h3>

▸ **lz.async**<`R`\>(`fn`, `options?`): `R`

Lazily initializes the result of an asynchronous function by only running it **once**.

The first call to the function will fetch the result.
Subsequent calls will return either:
- a promise that will resolve once the data is fetched
- the already fetched data.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | () => `Promise`<`R`\> | The asynchronous function to be lazily initialized. |
| `options` | [`LazyAsyncOptions`](#lz-async-options)<`R`\> | Optional object with configured options. |

#### Returns
`R` - the awaited value returned by `fn`.

```ts
// `lz.async` must be called inside an `async` function
const foo = async () => {
  // `await` is not required
  const result = lz.async(async () => {
    console.log('fetching')
    const data = await fetchData()
    return data.json()
  })
  return result
}
foo() // logs "fetching"
foo() // does not log
```
#### Plugin Transformation
> *original code*
```ts
const foo = async () => {
  const data = lz.async(() => fetch())
}
```
> *transformed code - notice the `await` has been added*
```ts
var lzVar;
const foo = async () => {
  const data = lzVar ?? (lzVar = await lz.async(() => fetch()))
}
```
<!---------- END: lazyAsync method ---------->
___

<!---------- START: option type decals ---------->

## Option Types


*<h3 id="lz-options">LazyOptions</h3>*

Options object for the [`lz`](#lz-method) method.

Ƭ **LazyOptions**: `Object`

#### Type declaration

| Name | Type | Description | Default |
| :------ | :------ | :------ | :------ |
| `cache?` | `boolean` | Set `true` to cache the object. Setting `true` \| `false` will override the default behavior. See [default cache behaviour](#default-caching-behavior).
| `freeze?` | `boolean` | Set `true` to freeze the object. | `false` |

___


*<h3 id="lz-fn-options">LazyFnOptions</h3>*

Options object for the [`lz.fn`](#lz-fn-method) / [`lazyFn`](#lz-fn-method) method.

Ƭ **LazyFnOptions**: `Object`

#### Type declaration

| Name | Type | Description | Default |
| :------ | :------ | :------ | :------ |
| `cache?` | `boolean` | Set `true` to cache the object returned by the function. Objects returned by functions are never cached by default. | `false` |

___


*<h3 id="lz-async-options">LazyAsyncOptions</h3>*

Options object for the [`lz.async`](#lz-async-method) / [`lazyAsync`](#lz-async-method) method.

Ƭ **LazyAsyncOptions**<`R`\>: `Object`

#### Type parameters

| Name | Description |
| :------ | :------ |
| `R` | Type of the awaited value returned by `fn`. |

#### Type declaration

| Name | Type | Description | Default |
| :------ | :------ | :------ | :------ |
| `cache?` | `boolean` | Set `true` to cache the object returned by the function. Objects returned by functions are never cached by default. | `false` |
| `fallback?` | `R` | Provide a fallback value that will be used if the asynchronous function throws an error. If no fallback value is provided, the error will be thrown. |
| `key?` | `string` | A unique identifier used to deduplicate multiple calls to the function before the asynchronous value has been initialized. | [`see`](#asynckey) |
| `onError?` | (`err`: `unknown`) => `void` | Called if the asynchronous function throws an error. |
| `onInitialized?` | (`res`: `R`) => `void` | Called when the asynchronous function is successfully resolved. |
| `retries?` | `number` | The number of attempts to retry the asynchronous function before throwing an error. | `0` |
| `retryInterval?` | `number` | The time *(ms)* to wait between each retry attempt. | `250` |

#### AsyncKey
The lazy-init plugin will automatically generate a 12 char alphanumeric unique key. However, you may provide your own value if needed.
<!---------- END: option type decals ---------->
___

## Old Versions

To use older versions compatible with your framework, install the plugin using its exact version.

<h3 id="next-js-old-versions">Next.js</h3>


|       Version        |             Install              |
| :------------------- |:--------------------------------:|
| `13.1.4 ~ 13.2.3`    | `@lazy-init/nextjs-plugin@2.2.0` |


<h3 id="swc-old-versions">SWC - @swc/core</h3>

|       Version        |             Install              |
| :------------------- |:--------------------------------:|
| `1.3.40 ~ 1.3.42`    | `@lazy-init/nextjs-plugin@2.2.0` |
| `1.3.29 ~ 1.3.38`    | `@lazy-init/nextjs-plugin@2.2.0` |

___


## License

See [license](./LICENSE).
