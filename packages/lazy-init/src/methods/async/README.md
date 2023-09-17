[Docs](/README.md#methods) > lz.async

---

# Index

- [Lazy Async](#lazy-async)
  - [Basic Usage](#basic-usage)
  - [Transformation](#plugin-transformation)
- [API](#api)
  - [lz.async](#lzasync)
  - [LazyAsyncOptions](#lazyasyncoptions)

---

## Lazy Async

Lazily initializes the result of an asynchronous function by only running
it **once**.

```ts
function lz.async<R>(
   fn: () => Promise<R>, 
   options?: LazyAsyncOptions
): R
```

The first call to the function will fetch the result.
Subsequent calls will return either:

- a promise that will resolve once the data is fetched
- the already fetched data.

### Basic Usage

```ts
// `lz.async` must be called inside an `async` function.
const foo = async () => {
   // `await` is not required.
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

### Plugin Transformation

_original code_

```ts
const foo = async () => {
   const data = lz.async(() => fetch())
}
```

_transformed code - notice the `await` has been added_

```ts
var lzVar
const foo = async () => {
   const data = lzVar ?? (lzVar = await lz.async(() => fetch()))
}
```

# API

## lz.async

```ts
function lz.async<R>(
   fn: () => Promise<R>, 
   options?: LazyAsyncOptions
): R
```

Lazily initializes the result of an asynchronous function by only running
it **once**.

#### Type parameters

| Parameter | Description                                 |
| :-------- | :------------------------------------------ |
| `R`       | Type of the awaited value returned by `fn`. |

#### Parameters

| Parameter | Type                                           | Description                                            |
| :-------- | :--------------------------------------------- | :----------------------------------------------------- |
| `fn`      | () => `Promise`\<`R`\>                         | The asynchronous function to be lazily initialized.    |
| `options` | [`LazyAsyncOptions`](#lazyasyncoptions)\<`R`\> | Optional [LazyAsyncOptions](#lazyasyncoptions) object. |

#### Returns

`R` - The awaited value returned by `fn`.

#### Throws

If the awaited value returned by `fn` is `undefined`.

#### Alias

**`lzc.async`**

#### Source

[index.ts:105](./index.ts#L105)

## LazyAsyncOptions

```ts
type LazyAsyncOptions<R> = LazyOptions & {
   fallback?: R
   key?: string
   onError?: (err) => void
   onInitialized?: (res) => void
   retries?: number
   retryInterval?: number
}
```

Options object for the `lz.async` method.
Extends [LazyOptions](../obj/README.md#lazyoptions).

#### Type parameters

| Parameter | Description                                 |
| :-------- | :------------------------------------------ |
| `R`       | Type of the awaited value returned by `fn`. |

#### Type properties

#### `fallback`?: `R`

Provide a fallback value that will be used if the asynchronous
function throws an error.

If no fallback value is provided, the error will be thrown.

---

#### `key`?: `string`

A unique identifier used to deduplicate multiple calls to the function
before the asynchronous value has been initialized.

The lazy-init plugin will automatically generate a unique key,
however, you can provide your own value if needed.

##### Default

`"abc..."` - A 12 character long string (`[a-zA-Z0-9]`).

---

#### `onError`?: `(err) => void`

Called if the asynchronous function throws an error.

##### Parameters

| Parameter | Type      | Description                                           |
| :-------- | :-------- | :---------------------------------------------------- |
| `err`     | `unknown` | The error caught, most likely an instance of `Error`. |

---

#### `onInitialized`?: `(res) => void`

Called when the asynchronous function is successfully resolved.

##### Parameters

| Parameter | Type | Description                                      |
| :-------- | :--- | :----------------------------------------------- |
| `res`     | `R`  | The value returned by the asynchronous function. |

---

#### `retries`?: `number`

Number of attempts to retry the asynchronous function before throwing an error.
<br> This means the function will be called at most `retries + 1` times.

##### Default

`0` - If the function throws it will not be retried.

---

#### `retryInterval`?: `number`

The time _(ms)_ to wait between each retry attempt.

##### Default

`250`

---

#### Source

[index.ts:20](./index.ts#L20)

---
