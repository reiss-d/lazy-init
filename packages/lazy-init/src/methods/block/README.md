[Docs](/README.md#methods) > lz.block

---

# Index

- [Block](#block)
  - [Basic Usage](#basic-usage)
  - [Proper Usage](#proper-usage)
  <!-- - [Use Case](#use-case---) -->
  - [Transformation](#plugin-transformation)
    - [Inline](#inline-transform)
    - [Wrapped](#wrapped-transform)
- [API](#api)
  - [block](#block)

---

## Block

Block expression that will be _inlined_, removing the overhead of a
function call.

```ts
function block<R>(
   body: () => R,
   forceWrapped?: any
): R
```

#### Remarks

All code paths within the block must end with a `return` statement, otherwise
the block will be inlined by wrapping it within a `labeled` statement.

Usage of this function is currently restricted to specific requirements, see [proper usage](#proper-usage).

### Basic Usage

```ts
import { block } from 'lazy-init'

function ternaryHater(age: number) {
   // can also use `lz.block()`
   const reply = block(() => {
      if (age < 18) { return 'Bedtime for you' }
      if (age < 21) { return 'Inspect ID 6 times' }
      if (age > 80) { return 'Not tonight, young man' }
      return 'Come on in'
   })
   // ...
}
```

### Proper Usage

A `block(...)` call must always be on the right-hand-side (RHS) of a single variable declaration.

```ts
// ✅ correct use (RHS of a single variable decl)
let a = block(() => { ... })
var b = block(() => { ... })
const c = block(() => { ... })

// ❌ incorrect use
let a = 0, b = block(() => { ... })
let c = someFn(block(() => { ... }))
void block(() => { ... })
```

<!-- TODO: document use cases. -->
<!-- ### Use Case -  -->

### Plugin Transformation

#### Inline transform

_original code_

```ts
let result = block(() => {
   if (condA) { return 0 }
   if (condB) { return 1 }
   return 2
})
```

_transformed code_

```ts
let result
if (condA) { result = 0 }
else if (condB) { result = 1 }
else { result = 2 }
```

_transformed code (with compress option)_

```ts
let result
result = condA ? 0 : condB ? 1 : 2
```

#### Wrapped transform

_original code_

```ts
// Notice not all code paths will return!
let result = block(() => {
   if (condA) { return 0 }
   if (condB) { return 1 }
   noReturn()
})
```

_transformed code_

```ts
let result
b: {
   if (condA) {
      result = 0
      break b
   } else {
      if (condB) {
         result = 1
         break b
      } else {
         noReturn()
      }
   }
}
```

# API

## block

```ts
function block<R>(
   body: () => R,
   forceWrapped?: any
): R
```

Block expression that will be _inlined_, removing the overhead of a
function call.

#### Type parameters

| Parameter | Description                           |
| :-------- | :------------------------------------ |
| `R`       | Type of the value returned by `body`. |

#### Parameters

| Parameter      | Type      | Description                                                                            |
| :------------- | :-------- | :------------------------------------------------------------------------------------- |
| `body`         | () => `R` | A function with no arguments and a body that is a block statement that returns/throws. |
| `forceWrapped` | `any`     | Pass any value as the second argument to force the block to be wrapped.                |

#### Returns

`R` - The value returned by `body`.

#### Alias

**`lz.block`**
**`lzc.block`**

#### Source

[index.ts:67](./index.ts#L67)

---
