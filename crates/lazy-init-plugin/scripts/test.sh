#!/usr/bin/env bash

versions=('075' '076')

if [[ "$1" == "--one" ]]; then
  versions=("${versions[0]}")
fi

for version in "${versions[@]}"; do
  feature="use-swc_core_v$version"

  cargo test -p swc_plugin_lazy_init --no-default-features --features "$feature" --features use-testing --
  # --show-output
done
