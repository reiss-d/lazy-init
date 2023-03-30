#!/usr/bin/env bash

feats=('use-swc_core_v069' 'use-swc_core_v061_64' 'use-swc_core_v054_59')
vers=('v069' 'v061_64' 'v054_59')
pkgDirs=('plugin-nextjs' 'plugin-swc-core')

for i in {0..2}; do

  feat=${feats[$i]}
  ver=${vers[$i]}
  echo "Building $ver with $feat"

  cargo build -p swc_plugin_lazy_init --release --no-default-features --features "$feat" --features use-plugin_transform --target wasm32-wasi

  for pkg in "${pkgDirs[@]}"; do

    if [[ "$ver" == "v061_64" && "$pkg" == "plugin-nextjs" ]]; then
      # nextjs doesn't support v061_64
      continue
    fi

    cp ../../target/wasm32-wasi/release/swc_plugin_lazy_init.wasm ../../packages/"$pkg"/dist/swc_plugin_lazy_init_"$ver".wasm

  done

done
