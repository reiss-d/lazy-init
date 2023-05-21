#!/usr/bin/env bash

versions=('075' '076')
pkgDirs=('plugin-nextjs' 'plugin-swc-core')

for version in "${versions[@]}"; do

  feature="use-swc_core_v$version"
  echo "Building v$version with $feature"

  cargo build -p swc_plugin_lazy_init --release --no-default-features --features "$feature" --features use-plugin_transform --target wasm32-wasi

  for pkg in "${pkgDirs[@]}"; do

    # if [[ "$version" == "076" && "$pkg" == "plugin-nextjs" ]]; then
    #   # nextjs doesn't need v0.76.0
    #   continue
    # fi

    cp ../../target/wasm32-wasi/release/swc_plugin_lazy_init.wasm ../../packages/"$pkg"/dist/swc_plugin_lazy_init_v"$version".wasm

  done

done
