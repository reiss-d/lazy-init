#!/usr/bin/env bash

versions=('075')
pkgDirs=('plugin-nextjs' 'plugin-swc-core')

for version in "${versions[@]}"; do

  feature="use-swc_core_v$version"
  echo "Building $version with $feature"

  cargo build -p swc_plugin_lazy_init --release --no-default-features --features "$feature" --features use-plugin_transform --target wasm32-wasi

  for pkg in "${pkgDirs[@]}"; do

    # if [[ "$version" == "061_64" && "$pkg" == "plugin-nextjs" ]]; then
    #   # nextjs doesn't support v061_64
    #   continue
    # fi

    cp ../../target/wasm32-wasi/release/swc_plugin_lazy_init.wasm ../../packages/"$pkg"/dist/swc_plugin_lazy_init_v"$version".wasm

  done

done
