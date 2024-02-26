### `eslint-plugin-lazy-init`

Eslint plugin for use with [`lazy-init`](https://github.com/reiss-d/lazy-init.git).

This plugin is only necessary if you are using [@typescript-eslint](#https://typescript-eslint.io/) and your configuration extends rules that [require type checking](#https://typescript-eslint.io/linting/typed-linting).

## Setup

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

## License

See [license](./LICENSE).
