[Docs](/README.md#methods) > lz

---

# Index

- [Lazy](#lazy)
  - [Basic Usage](#basic-usage)
  - [Use Case](#use-case---react-hook)
  - [Transformation](#plugin-transformation)
- [API](#api)
  - [lz](#lz)
  - [LazyOptions](#lazyasyncoptions)

---

## Lazy

Lazily initialize any non-primitive value by only creating it **once**.

```ts
function lz<T extends object>(
   value: T,
   optionsOrFreeze?: LazyOptions | boolean
): T
```

The first call to `lz` will create the value and hoist it into a lazy
variable. After which the same value will be returned without additional
calls to `lz`.

See [caching](/README.md#caching) and [freezing](/README.md#freezing) for
more information on the available options.

### Basic Usage

```ts
const foo = () => {
   const obj = lz({ a: 1 })
   return obj
}
const a = foo()
const b = foo()
a === b // true
```

### Use Case - React Hook

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

### Caching

Caching results in only a single value ever being created for the given
value structure.

See [here](/README.md#caching) for more details on caching.

```ts
const foo = lz({ a: 1 }, { cache: true })
const bar = lz({ a: 1 }, { cache: true })
foo === bar // true

const buzz = lz({ a: 1 }, { cache: false })
foo === buzz // false

const diff = lz({ a: 2 }, { cache: true })
foo === diff // false
```

To enable caching by default, use the `lzc` method. Note that this has the
implicit side-effect of also [freezing](/README.md#freezing) by default unless
explicitly disabled.

```ts
import { lz, lzc } from 'lazy-init'

// not cached by default
lz({ a: 1 }) // not cached
lz({ b: 1 }, { cache: true }) // cached

// cached by default
lzc({ c: 1 }) // cached
lzc({ d: 1 }, { cache: false }) // not cached
```

### Plugin Transformation

_original code_

```ts
const foo = () => {
   const obj = lz({ a: 1 })
}
```

_transformed code_

```ts
var lzVar // hoisted variable
const foo = () => {
   const obj = lzVar ?? (lzVar = lz({ a: 1 }))
}
```

# API

## lz

```ts
function lz<T extends object>(
   value: T,
   optionsOrFreeze?: LazyOptions | boolean
): T
```

Lazily initialize any non-primitive value by only creating it **once**.

#### Type parameters

| Parameter              | Description                                 |
| :--------------------- | :------------------------------------------ |
| `T` _extends_ `object` | The type of the value to lazily initialize. |

#### Parameters

| Parameter          | Type                                       | Description                                                                                                                |
| :----------------- | :----------------------------------------- | :------------------------------------------------------------------------------------------------------------------------- |
| `value`            | `T`                                        | The value to lazily initialize.                                                                                            |
| `optionsOrFreeze`? | `boolean` \| [`LazyOptions`](#lazyoptions) | Optional parameter that can be `true` to [freeze](/README.md#freezing) the value, or a [LazyOptions](#lazyoptions) object. |

#### Returns

`T` - The initialized value.

#### Alias

**`lzc`** - Where caching is enabled by default.

#### Source

[index.ts:103](./index.ts#L103)

## LazyOptions

```ts
type LazyOptions = {
   cache?: boolean
   freeze?: boolean
}
```

Options object to customize the behaviour of lazy methods.

#### Type declaration

| Member    | Type      | Description                                                                                                                                       |
| :-------- | :-------- | :------------------------------------------------------------------------------------------------------------------------------------------------ |
| `cache?`  | `boolean` | Whether to [cache](/README.md#caching) the lazy value.<br><br>When this is `true`, `freeze` defaults to `true` unless explicitly set to `false`.  |
| `freeze?` | `boolean` | Whether to [freeze](/README.md#freezing) the lazy value.<br><br>When `cache` is `true`, this defaults to `true` unless explicitly set to `false`. |

#### Default

The default values change to `true` for the `lzc` method as it enables
caching by default - which implicitly enables freezing too.

However, that does **not** include `lzc.fn` and `lzc.async` as they are **never**
cached by default and must be explicitly told to do so.

| Property | `lz`    | `lzc`  | `(lz\|lzc).fn` | `(lz\|lzc).async` |
| :------- | :------ | :----- | :------------- | :---------------- |
| `cache`  | `false` | `true` | `false`        | `false`           |
| `freeze` | `false` | `true` | `false`        | `false`           |

**Remember** as mentioned before, changing the value of `cache` will change the
default value of `freeze`.

### Source

[../../options.ts:13](../../options.ts#L13)

---
