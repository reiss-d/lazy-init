#![deny(
   clippy::all,
   clippy::implicit_return,
   clippy::unneeded_field_pattern,
   clippy::if_then_some_else_none,
   clippy::self_named_module_files,
   clippy::unseparated_literal_suffix
)]
#![warn(
   clippy::style,
   clippy::pedantic,
   clippy::unwrap_used,
   clippy::str_to_string
)]
#![allow(
   clippy::too_many_lines,
   clippy::needless_return,
   clippy::match_same_arms,
   clippy::wildcard_imports,
   clippy::must_use_candidate,
   clippy::missing_panics_doc,
   clippy::explicit_auto_deref,
   clippy::struct_excessive_bools,
   clippy::module_name_repetitions,
   clippy::no_mangle_with_rust_abi,
   clippy::wildcard_enum_match_arm,
   clippy::missing_docs_in_private_items,
   clippy::match_wildcard_for_single_variants
)]
pub mod block;
pub mod configs;
pub mod context;
pub mod hoist;
pub mod lazy_init_pkg;
pub mod macros;
pub mod normalizer;
pub mod utils;
pub mod visitor;

#[cfg(test)]
pub mod tests;

#[cfg(feature = "use-plugin_transform")]
use swc_core::plugin::{
   plugin_transform, proxies::TransformPluginProgramMetadata,
};
#[cfg(feature = "use-plugin_transform")]
use swc_ecma_ast::Program;
#[cfg(feature = "use-plugin_transform")]
use swc_ecma_visit::{as_folder, FoldWith};

// clippy is failing to allow str_to_string in plugin_transform
#[allow(
   clippy::needless_pass_by_value,
   clippy::str_to_string
)]
#[cfg(feature = "use-plugin_transform")]
#[plugin_transform]
fn lazy_init_plugin(
   program: Program,
   data: TransformPluginProgramMetadata,
) -> Program {
   tracing::debug!("Running => lazy_init_plugin ...");

   let config: configs::PluginConfig = serde_json::from_str(
      &data
         .get_transform_plugin_config()
         .expect("failed to get plugin config for lazy-init-plugin"),
   )
   .expect("failed to parse config for lazy-init-plugin");

   if config.disable {
      return program;
   }

   return program.fold_with(&mut as_folder(visitor::LazyVisitor::new(
      config,
      visitor::ProgramMetadata {
         unresolved_mark: data.unresolved_mark,
      },
   )));
}
