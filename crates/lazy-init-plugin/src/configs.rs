use serde::Deserialize;
use serde_repr::{Deserialize_repr, Serialize_repr};
use swc_atoms::JsWord;
use swc_ecma_ast::*;

use super::*;
use lazy_init_pkg::{ExportedFn, ExportedFnKind, LzMethod, LzMethodKind};

#[derive(Debug, Default, Clone, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct PluginConfig {
   /// The operator used to check whether a lazy variable has been
   /// initialized.
   ///
   /// `0` - Nullish Coalescing (`??`)
   /// ```ts
   /// lzVar ?? (lzVar = lz({}));
   /// ```
   ///
   /// `1` - Logical OR (`||`)
   /// ```ts
   /// lzVar || (lzVar = lz({}));
   /// ```
   ///
   /// Defaults to `0` (`??`).
   #[serde(default)]
   pub operator: LazyOperator,

   // TODO: Document the schema for this option in more detail.
   /// Configure custom functions that will be transformed in the same way as
   /// those exported from `lazy-init`.
   ///
   /// ### Example
   /// ```ts
   /// // Config
   /// {
   ///    customFns: [
   ///       ["@myorg/lazy", {
   ///          lz: [
   ///             ["customLazy", {
   ///                fn: ["func", "call"],
   ///                async: ["ac"],
   ///                block: ["scoped"],
   ///             }],
   ///          ],
   ///          block: ["bk", "wrapper"],
   ///       }],
   ///    ],
   /// }
   /// // Custom function use with equivalent lazy-init function
   /// import { lz, block } from "lazy-init";
   /// import { customLazy, bk, wrapper } from "@myorg/lazy";
   ///
   /// lz(...)
   /// customLazy(...)
   ///
   /// lz.fn(...)
   /// customLazy.func(...)
   /// customLazy.call(...)
   ///
   /// lz.async(...)
   /// customLazy.ac(...)
   ///
   /// lz.block(...)
   /// customLazy.scoped(...)
   ///
   /// block(...)
   /// bk(...)
   /// wrapper(...)
   /// ```
   #[serde(default)]
   pub custom_fns: Vec<(JsWord, CustomLazyFns)>,

   /// Do not check for imports from the `lazy-init` library.
   ///
   /// Set to `true` if you are solely using a custom lazy function from a
   /// different library.
   #[serde(default)]
   pub ignore_lazy_library: bool,

   /// Disable this plugin.
   #[serde(default)]
   pub disable: bool,

   /// ### EXPERIMENTAL
   /// Whether to minify the code within `lz.block()` calls to reduce the
   /// output of inlined code. This process will only compress the code by
   /// attempting to simplify expressions and branches, and will not perform
   /// any obfuscation such as "mangling" variable names.
   ///
   /// Defaults to `false`.
   #[serde(default = "compress_blocks_default")]
   pub compress_blocks: bool,
}

fn compress_blocks_default() -> bool {
   // TODO: Enable this by default once it's stable.
   return false;
}

#[derive(Debug, Default, Clone, Deserialize_repr, Serialize_repr)]
#[repr(u8)]
pub enum LazyOperator {
   #[default]
   /// Nullish Coalescing (`??`)
   NullishCoalescing = 0,
   /// Logical OR (`||`)
   LogicalOr = 1,
}

impl LazyOperator {
   pub fn to_bin_op(&self) -> BinaryOp {
      return match self {
         LazyOperator::NullishCoalescing => op!("??"),
         LazyOperator::LogicalOr => op!("||"),
      };
   }
}

#[derive(Debug, Default, Clone, Deserialize, PartialEq, Eq)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct CustomLazyFns {
   #[serde(default)]
   pub lz: Vec<(JsWord, CustomLzMethodMap)>,

   #[serde(default)]
   pub block: Vec<JsWord>,
}

impl CustomLazyFns {
   pub fn find_fn(&self, name: &JsWord) -> Option<ExportedFn> {
      return self
         .find_lz_fn(name)
         .or_else(|| return self.find_block_fn(name));
   }

   fn find_lz_fn(&self, name: &JsWord) -> Option<ExportedFn> {
      let (_, method_map) = self.lz.iter().find(|(n, _)| {
         return n == name;
      })?;

      return Some(ExportedFn {
         kind: ExportedFnKind::Hoist,
         methods: Some(method_map.get_lz_methods()),
      });
   }

   fn find_block_fn(&self, name: &JsWord) -> Option<ExportedFn> {
      let found = self.block.iter().any(|n| {
         return n == name;
      });

      if found {
         return Some(ExportedFn {
            kind: ExportedFnKind::Block,
            methods: None,
         });
      }
      return None;
   }
}

#[derive(Debug, Default, Clone, Deserialize, PartialEq, Eq)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct CustomLzMethodMap {
   #[serde(default, rename = "fn")]
   pub func: Vec<JsWord>,

   #[serde(default, rename = "async")]
   pub asynchronous: Vec<JsWord>,

   #[serde(default)]
   pub block: Vec<JsWord>,
}

impl CustomLzMethodMap {
   pub fn get_lz_methods(&self) -> Vec<LzMethod> {
      let mut methods: Vec<LzMethod> = Vec::new();

      for method in &self.block {
         methods.push(LzMethod {
            sym: method.clone(),
            kind: LzMethodKind::Block,
         });
      }
      for method in &self.func {
         methods.push(LzMethod {
            sym: method.clone(),
            kind: LzMethodKind::Fn,
         });
      }
      for method in &self.asynchronous {
         methods.push(LzMethod {
            sym: method.clone(),
            kind: LzMethodKind::Async,
         });
      }
      return methods;
   }
}

#[allow(clippy::needless_pass_by_value)]
#[cfg(test)]
mod config_parse_test {
   use super::*;
   use serde_json::json;

   #[test]
   fn a() {
      let config_json = json!({
         "operator": 1,
         "customFns": [
            ["@myorg/lazy", {
               "lz": [["customLazy", {
                  "fn": ["func", "call"],
                  "async": ["ac"],
                  "block": ["scoped"],
               }]],
               "block": ["bk", "wrapper"],
            }],
         ],
      });

      let config: PluginConfig =
         serde_json::from_value(config_json).expect("failed to parse config");

      assert_eq!(config.operator.to_bin_op(), op!("||"));

      let expected_custom_fns: Vec<(JsWord, CustomLazyFns)> =
         vec![("@myorg/lazy".into(), CustomLazyFns {
            lz: vec![
               ("customLazy".into(), CustomLzMethodMap {
                  func: vec!["func".into(), "call".into()],
                  asynchronous: vec!["ac".into()],
                  block: vec!["scoped".into()],
               }),
            ],
            block: vec!["bk".into(), "wrapper".into()],
         })];

      // pub custom_fns: Vec<(JsWord, CustomLazyFns)>
      assert_eq!(config.custom_fns, expected_custom_fns);
   }
}
