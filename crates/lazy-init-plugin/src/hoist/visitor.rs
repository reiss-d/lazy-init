// use either::Either;
use std::vec;
use swc_common::{util::take::Take, DUMMY_SP};
use swc_ecma_ast::*;
use swc_ecma_utils::{undefined, ExprFactory};
use swc_ecma_visit::{
   noop_visit_mut_type, visit_mut_obj_and_computed, VisitMut, VisitMutWith,
};

use super::*;
use crate::visitor::{LazyVisitor, LzMethodFound};
use lazy_init_pkg::{ExportedFn, LzMethodKind};
use utils::LazyVar;

#[derive(Debug)]
pub struct ImportedFn {
   pub id: Id,
   pub exported_fn: ExportedFn,
}

#[derive(Debug)]
pub struct LazyHoistVisitor<'a> {
   main: &'a mut LazyVisitor,
   /// Whether some variant of `lz.block()` was found.
   pub found_block: bool,
}

impl LazyHoistVisitor<'_> {
   pub fn visit<'a>(
      lazy_visitor: &'a mut LazyVisitor,
      items: &mut Vec<ModuleItem>,
   ) -> LazyHoistVisitor<'a> {
      let mut v = LazyHoistVisitor {
         main: lazy_visitor,
         found_block: false,
      };
      items.visit_mut_with(&mut v);
      return v;
   }

   fn handle_hoist(
      &mut self,
      call_expr: &mut CallExpr,
      method: &LzMethodFound,
   ) {
      debug_assert!(!matches!(method.kind, LzMethodKind::Block));

      let mut lazy_args = call_expr.args.take();
      let is_async = matches!(method.kind, LzMethodKind::Async);

      if is_async {
         let no_options_arg = lazy_args.get(1).is_none();

         if no_options_arg {
            lazy_args.insert(1, undefined(DUMMY_SP).as_arg());
         }
         // Pass unique key as the third argument.
         lazy_args.insert(
            2,
            Str {
               span: DUMMY_SP,
               value: utils::rand_string().into(),
               raw: None,
            }
            .as_arg(),
         );
      }

      let mut initializer = Box::new(Expr::Call(CallExpr {
         span: DUMMY_SP,
         callee: call_expr.callee.take(),
         args: lazy_args,
         type_args: None,
      }));

      if is_async {
         // `await initializer()`
         initializer = Box::new(Expr::Await(AwaitExpr {
            span: DUMMY_SP,
            arg: initializer,
         }));
      }

      let lazy_var = LazyVar::new();
      self.main.lazy_vars_inserted.push(lazy_var.declarator);

      // `lazyVar = initializer()`
      let assign_to_lazy_var = Box::new(
         initializer
            .make_assign_to(op!("="), lazy_var.ident.clone().as_pat_or_expr()),
      );
      // `lazyVar ?? (lazyVar = initializer())`
      let mut get_or_initialize = Expr::Ident(lazy_var.ident).make_bin(
         self.main.config.operator.to_bin_op(),
         Expr::Paren(ParenExpr {
            span: DUMMY_SP,
            expr: assign_to_lazy_var,
         }),
      );

      if is_async {
         // `(lazyVar ?? (lazyVar = await initializer()))`
         get_or_initialize = get_or_initialize.wrap_with_paren();
      }

      call_expr.args = vec![
         ExprOrSpread {
            spread: None,
            expr: Box::new(get_or_initialize),
         };
         1
      ];

      // Drop the function call but keep the parentheses.
      // TODO: is there a better way to do this? much easier than finding
      // the parent node and replacing the actual call expression.
      call_expr.callee = utils::replace_identity_fn();
   }
}

impl VisitMut for LazyHoistVisitor<'_> {
   noop_visit_mut_type!();

   visit_mut_obj_and_computed!();

   fn visit_mut_call_expr(&mut self, call_expr: &mut CallExpr) {
      call_expr.visit_mut_children_with(self);

      if let Some(method) = self.main.find_lazy_method(call_expr) {
         if method.kind == LzMethodKind::Block {
            self.found_block = true;
         } else {
            self.handle_hoist(call_expr, &method);
         }
      }
   }
}
