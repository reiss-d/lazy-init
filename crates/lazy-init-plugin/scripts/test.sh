#!/usr/bin/env bash

feats=('use-swc_core_v069' 'use-swc_core_v061_64' 'use-swc_core_v054_59')

if [[ "$1" == "--one" ]]; then
  feats=("${feats[0]}")
fi

for i in "${feats[@]}"; do
  cargo test -p swc_plugin_lazy_init --no-default-features --features "$i" --features use-testing --
  # --show-output
done
