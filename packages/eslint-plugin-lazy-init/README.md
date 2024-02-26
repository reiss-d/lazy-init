### `eslint-plugin-lazy-init`

Eslint plugin for use with [`lazy-init`](https://github.com/reiss-d/lazy-init.git).

This plugin is only necessary if you want to use the `lz.async` method while
using [@typescript-eslint](https://typescript-eslint.io/) with a configuration
that extends rules which [require type checking](https://typescript-eslint.io/getting-started/typed-linting).

## Installation

Installing plugin for `@typescript-eslint` version `^6` or greater:

```bash
# using npm
npm install --save-dev eslint-plugin-lazy-init 
# using pnpm
pnpm add -D eslint-plugin-lazy-init
```

Installing plugin for `@typescript-eslint` version `^5`:

```bash
# using npm
npm install --save-dev eslint-plugin-lazy-init@^5.0.0
# using pnpm
pnpm add -D eslint-plugin-lazy-init@^5.0.0
```

## Setup

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

## License

See [license](./LICENSE).
