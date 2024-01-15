use swc_atoms::JsWord;
use swc_common::Mark;
use swc_ecma_ast::*;
use swc_ecma_visit::{noop_visit_mut_type, VisitMut, VisitMutWith};
use tracing::debug;

use super::*;
use block::LazyBlockVisitor;
use configs::PluginConfig;
use hoist::LazyHoistVisitor;
use lazy_init_pkg::{
   to_exported_fn, ExportedFn, LzMethodKind, PKG_NAME_JSWORD,
};

#[derive(Debug)]
pub struct ImportedFn {
   pub id: Id,
   pub exported_fn: ExportedFn,
}

#[derive(Debug, Default)]
pub struct LazyVisitor {
   pub config: PluginConfig,
   pub imported_fns: Vec<ImportedFn>,
   pub lazy_vars_inserted: Vec<VarDeclarator>,
   pub metadata: ProgramMetadata,
}

#[derive(Debug)]
pub struct ProgramMetadata {
   // pub comments: Option<PluginCommentsProxy>,
   // pub source_map: PluginSourceMapProxy,
   pub unresolved_mark: Mark,
}

impl Default for ProgramMetadata {
   fn default() -> Self {
      return ProgramMetadata {
         unresolved_mark: Mark::new(),
      };
   }
}

// impl ProgramMetadata {
//    pub fn get_source_file(&mut self) -> Arc<swc_common::SourceFile> {
//       return self.source_map.source_file.wait().clone();
//    }
// }

#[derive(Debug, Clone)]
pub struct LzMethodFound {
   /// `"lz"` in `lz()` and `lz.fn()`.
   pub id: JsWord,
   /// `None` in `lz()` or `Some("fn")` in `lz.fn()`.
   pub method: Option<JsWord>,
   /// The kind of method.
   pub kind: LzMethodKind,
}

impl LzMethodFound {
   pub fn format(&self) -> String {
      if let Some(method) = &self.method {
         return format!("`{}.{}()`", &self.id, method);
      }
      return format!("`{}()`", &self.id);
   }
}

impl LazyVisitor {
   pub fn new(config: PluginConfig, metadata: ProgramMetadata) -> Self {
      return Self {
         config,
         metadata,
         ..Default::default()
      };
   }

   // Called by the `LazyBlockVisitor` and `LazyHoistVisitor`.
   pub fn find_lazy_method(
      &self,
      call_expr: &mut CallExpr,
   ) -> Option<LzMethodFound> {
      // All methods require arguments.
      bail_if!(call_expr.args.is_empty(), None);

      let callee_expr = call_expr.callee.as_expr()?;
      let (
         // `"lz"` in `lz()` and `lz.fn()`.
         id,
         // `None` in `lz()` or `Some("fn")` in `lz.fn()`.
         method,
      ) = {
         if let Expr::Member(member) = &**callee_expr {
            // Call expression is a member expression e.g. `lz.fn()`.
            (
               member.obj.as_ident()?.to_id(),
               Some(member.prop.as_ident()?.sym.clone()),
            )
         } else {
            // Call expression is not a member expression e.g. `lz()`.
            (callee_expr.as_ident()?.to_id(), None)
         }
      };

      // Find the imported function that this callee refers to.
      let imported_fn = &self
         .imported_fns
         .iter()
         .find(|f| return f.id == id)?
         .exported_fn;

      let kind = if let Some(callee_method) = &method {
         imported_fn
            .methods
            .as_ref()?
            .iter()
            .find(|m| return m.sym == *callee_method)?
            .kind
      } else {
         imported_fn.kind.into()
      };

      return Some(LzMethodFound {
         id: id.0,
         method,
         kind,
      });
   }
}

impl VisitMut for LazyVisitor {
   noop_visit_mut_type!();

   // Visitor entry point.
   fn visit_mut_module_items(&mut self, items: &mut Vec<ModuleItem>) {
      items.visit_mut_children_with(self);

      // Skip if no lazy fns were imported.
      bail_if!(self.imported_fns.is_empty());

      // Running this visitor will let us know if it came across a block
      // that will need to be visited by the `LazyBlockVisitor`.
      let found_block = LazyHoistVisitor::visit(self, items).found_block;
      debug!("found_block: {found_block}");

      if found_block {
         LazyBlockVisitor::visit(self, items);
      }

      if !self.lazy_vars_inserted.is_empty() {
         // Insert all the created lazy variables after imports.
         utils::insert_item_after_imports(
            items,
            ModuleItem::Stmt(Stmt::Decl(utils::create_var_declaration(
               self.lazy_vars_inserted.drain(..).collect(),
            ))),
         );
      }
   }

   fn visit_mut_import_decl(&mut self, import_decl: &mut ImportDecl) {
      // import ... from "<source>"
      let source = &import_decl.src.value;

      let is_lazy_init =
         !self.config.ignore_lazy_library && source == &*PKG_NAME_JSWORD;

      let custom_fns = if is_lazy_init {
         None
      } else {
         // Search for a custom import source that matches this source.
         self
            .config
            .custom_fns
            .iter()
            .find(|(s, _)| return s == source)
            .map(|(_, fns)| return fns)
      };

      // Import source is neither "lazy-init" nor custom.
      bail_if!(!is_lazy_init && custom_fns.is_none());

      for specifier in &import_decl.specifiers {
         let import = unwrap_or!(parse_import(specifier), continue);
         // Search the list of valid exported lazy functions for this import.
         let exported_fn = if let Some(custom_fns) = custom_fns {
            // Default import is not supported for custom imports.
            if import.is_default {
               continue;
            }
            custom_fns.find_fn(import.name)
         } else {
            to_exported_fn(import.is_default, import.name)
         };

         if let Some(exported_fn) = exported_fn {
            // This import refers to a valid lazy function.
            self.imported_fns.push(ImportedFn {
               id: import.ident.to_id(),
               exported_fn,
            });
         } else {
            // Although this import has a source that exports lazy functions, it
            // doesn't refer to a valid lazy function. This is likely some other
            // export from a user provided library that should be ignored.
         }
      }
   }

   fn visit_mut_script(&mut self, _: &mut Script) {
      // This plugin only supports modules since it relies on imports.
      return;
   }
}

struct ParsedImport<'a> {
   /// Whether the import is a default import.
   is_default: bool,
   /// The local identifier of the imported item.
   ident: &'a Ident,
   /// The name of the imported item.
   /// ```ts
   /// import { name } from "source"; // or
   /// import { name as local } from "source"; // or
   /// import name from "source";
   /// ```
   name: &'a JsWord,
}

fn parse_import(spec: &ImportSpecifier) -> Option<ParsedImport<'_>> {
   match spec {
      // import { <local> } from "<source>"; // or
      // import { <imported> as <local> } from "<source>";
      ImportSpecifier::Named(named) => {
         return Some(ParsedImport {
            is_default: false,
            ident: &named.local,
            name: match &named.imported {
               Some(ModuleExportName::Ident(ident)) => &ident.sym,
               Some(ModuleExportName::Str(lit)) => &lit.value,
               _ => &named.local.sym,
            },
         });
      }
      // import <local> from "<source>";
      ImportSpecifier::Default(default) => {
         return Some(ParsedImport {
            is_default: true,
            ident: &default.local,
            name: &default.local.sym,
         });
      }
      _ => {
         return None;
      }
   };
}
