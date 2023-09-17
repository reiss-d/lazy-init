[Docs](/README.md#methods) > lz.fn

---

# Index

- [Lazy Fn](#lazy-fn)
  - [Basic Usage](#basic-usage)
  - [Use Case](#use-case---setup)
  - [Transformation](#plugin-transformation)
- [API](#api)
  - [lz.fn](#lzfn)
  - [LazyFnOptions](#lazyfnoptions)

---

## Lazy Fn

Lazily initializes the result of a function by only running it **once**.

```ts
function lz.fn<R>(
   fn: () => R, 
   options?: LazyFnOptions
): R
```

The first call to the function will get the result and hoist it into a lazy
variable. Subsequent calls will return the lazy variable.

### Basic Usage

```ts
const foo = () => {
   const result = lz.fn(() => {
      console.log('this will only be logged once')
      return { bar: 1 }
   })
   return result // { bar: 1 }
}
const a = foo() // logs: 'this will only be logged once'
const b = foo() // does not log
a === b // true
```

### Use Case - Setup

A common situation you can find yourself in is a function requiring some setup
logic that should only be run once, before continuing on as normal.

To do so, we need to create two variables:

- `isInitalized` - Signifies whether the setup has run.
- `state` - Stores some object we created during the setup.

For Typescript users, this can be more of a nuisance since the `state`
variable will need to be explicitly typed:

```ts
let isInitalized = false
let state: State | undefined = undefined
```

Sometimes it's worse when the type is from an external library that doesn't
export said type and you have to do this:

```ts
import { setup } from 'external-lib'
let isInitalized = false
let state: ReturnType<typeof setup> | undefined = undefined
```

In the end, we have code that follows along the lines of this:

```ts
let isInitalized = false
let state: State | undefined = undefined

const main = () => {
   if (!isInitalized) {
      const params = []
      // ... param logic
      state = setup(params)
      isInitalized = true
   }
   // ... actual function body
}
```

Now lets see how this code looks when using `lz.fn`.
The resulting code is _cleaner_ and more _concise_, we no longer have to define
variables outside of the function scope or waste time typing them:

```ts
const main = () => {
   const state = lz.fn(() => {
      const params = []
      // ... param logic
      return setup(params)
   })
   // ... actual function body
}
```

### Plugin Transformation

_original code_

```ts
const foo = () => {
   const result = lz.fn(() => ({ a: 1 }))
}
```

_transformed code_

```ts
var lzVar
const foo = () => {
   const result = lzVar ??
      (lzVar = lz.fn(() => ({ a: 1 })))
}
```

# API

## lz.fn

```ts
function lz.fn<R>(
   fn: () => R, 
   options?: LazyFnOptions
): R
```

Lazily initializes the result of a function by only running it **once**.

#### Type parameters

| Parameter | Description                         |
| :-------- | :---------------------------------- |
| `R`       | Type of the value returned by `fn`. |

#### Parameters

| Parameter | Type                              | Description                                      |
| :-------- | :-------------------------------- | :----------------------------------------------- |
| `fn`      | () => `R`                         | The function to be lazily initialized.           |
| `options` | [`LazyFnOptions`](#lazyfnoptions) | Optional [LazyFnOptions](#lazyfnoptions) object. |

#### Returns

`R` - The value returned by `fn`.

#### Throws

If the value returned by `fn` is `undefined`.

#### Alias

**`lzc.fn`**

#### Source

[index.ts:56](./index.ts#L56)

## LazyFnOptions

```ts
type LazyFnOptions = LazyOptions & {
   // may have additional options in future
}
```

Options object for the `lz.fn` method.
Extends [LazyOptions](../obj/README.md#lazyoptions).

#### Source

[index.ts:12](./index.ts#L12)

---
