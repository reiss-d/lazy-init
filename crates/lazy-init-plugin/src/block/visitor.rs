use either::{
   for_both,
   Either::{self, Left, Right},
};
use swc_common::{util::take::Take, Mark, DUMMY_SP};
use swc_ecma_ast::*;
use swc_ecma_minifier::{
   optimize,
   option::{CompressOptions, ExtraOptions, MinifyOptions},
};
use swc_ecma_utils::{replace_ident, undefined, ExprFactory};
use swc_ecma_visit::{noop_visit_mut_type, VisitMut, VisitMutWith};

use super::*;
use crate::visitor::{LazyVisitor, LzMethodFound};
use analyzer::{analyze, TransformType};
use lazy_init_pkg::LzMethodKind;
use normalizer::normalize_block;
use utils::{BlockLabel, LazyVar};
use visitor_state_macro::save_state;

#[derive(Debug)]
pub struct LazyBlockVisitor<'a> {
   main: &'a mut LazyVisitor,
   mode: Mode,
   block: Option<Block>,
}

#[derive(Debug, Clone, Copy, PartialEq)]
enum Mode {
   /// The visitor is searching for blocks and will transform those found.
   Transform,
   /// The visitor is searching for a block and will not perform
   /// transformations. The bool value indicates whether a block was found.
   /// This is used to determine if we can safely minify a block based on
   /// whether it contains nested blocks.
   SearchOnly(bool),
}

#[derive(Debug)]
struct Block {
   decl_kind: VarDeclKind,
   temp_var: LazyVar,
   stmts: Vec<Stmt>,
}

impl LazyBlockVisitor<'_> {
   pub fn visit<'a>(
      lazy_visitor: &'a mut LazyVisitor,
      items: &mut Vec<ModuleItem>,
   ) -> LazyBlockVisitor<'a> {
      let mut v = LazyBlockVisitor {
         main: lazy_visitor,
         mode: Mode::Transform,
         block: None,
      };
      items.visit_mut_with(&mut v);
      return v;
   }

   fn handle_block(
      &mut self,
      call_expr: &mut CallExpr,
      method: &LzMethodFound,
   ) {
      // TODO: `lz` inside errors should be the actual function name.

      let mut lazy_args = call_expr.args.take();

      if lazy_args.is_empty() {
         swc_panic!(
            call_expr.span,
            (
               "Calls to {} must have an argument.",
               method.format()
            )
         );
      }

      let block_fn_arg = *lazy_args.remove(0).expr;
      // TODO: document this behavior.
      // Any extra argument indicates the user is forcing this block to be
      // wrapped.
      let force_wrapped = !lazy_args.is_empty();

      let mut block = match block_fn_arg {
         Expr::Fn(f) => swc_unwrap!(
            f.function.body,
            f.function.span,
            (
               "The function passed to {} must have a body.",
               method.format()
            )
         ),
         Expr::Arrow(mut a) => swc_unwrap!(
            a.body.as_mut_block_stmt(),
            a.span,
            (
               "The function passed to {} must have a body.",
               method.format()
            )
         )
         .take(),
         _ => swc_panic!(
            call_expr.span,
            (
               "The argument passed to {} must be a function expression or \
                arrow function expression with a body.",
               method.format()
            )
         ),
      };
      swc_assert!(
         !block.stmts.is_empty(),
         block.span,
         (
            "The function passed to {} cannot be empty.",
            method.format()
         )
      );

      // Prepare the block.
      block = normalize_block(self.compress_block(block));

      let mut transform_type = TransformType::Wrapped;

      if !force_wrapped {
         // Analyze the block.
         let mut block_as_stmt = Stmt::Block(block);
         let result = analyze(&mut block_as_stmt);

         block = match block_as_stmt {
            Stmt::Block(b) => b,
            _ => unreachable!(),
         };

         match result {
            Ok(ok) => {
               transform_type = ok.transform_type;
            }
            Err(err) => {
               swc_panic!(
                  err.span.unwrap_or_else(|| return call_expr.span),
                  (
                     "Encountered an error transforming the block passed to \
                      {}: {}",
                     method.format(),
                     err.msg
                  )
               );
            }
         }
      };

      // Transform the block.
      let temp_var = match transform_type {
         TransformType::Inline => {
            let mut v = inline_transform::Visitor::default();

            block.visit_mut_with(&mut v);
            v.temp_var
         }
         TransformType::Wrapped => {
            let mut v = wrapped_transform::Visitor::default();

            block.visit_mut_with(&mut v);
            v.temp_var
         }
      };

      self.block = Some(Block {
         decl_kind: VarDeclKind::Const,
         temp_var,
         stmts: block.stmts.take(),
      });
   }

   fn compress_block(&mut self, mut block: BlockStmt) -> BlockStmt {
      // User may have disabled block compression.
      bail_if!(!self.main.config.compress_blocks, block);
      // If a nested block is found, we cannot safely compress the block.
      bail_if!(self.search_for_nested(&mut block), block);

      let func = Expr::Fn(FnExpr {
         ident: None,
         function: Box::new(Function {
            span: DUMMY_SP,
            params: vec![],
            decorators: vec![],
            body: Some(block),
            is_generator: false,
            is_async: false,
            type_params: None,
            return_type: None,
         }),
      });

      let mut program = Program::Script(Script {
         span: DUMMY_SP,
         body: vec![Stmt::Expr(ExprStmt {
            span: DUMMY_SP,
            expr: Box::new(func.make_assign_to(
               AssignOp::AddAssign,
               PatOrExpr::Pat(Box::new(Pat::Ident(BindingIdent {
                  id: Ident {
                     span: DUMMY_SP,
                     sym: "globalThis".into(),
                     optional: false,
                  },
                  type_ann: None,
               }))),
            )),
         })],
         shebang: None,
      });

      program = optimize(
         program,
         std::sync::Arc::default(),
         None,
         None,
         &MinifyOptions {
            compress: Some(CompressOptions {
               keep_classnames: true,
               keep_fargs: true,
               keep_fnames: true,
               keep_infinity: true,
               module: false,
               ..Default::default()
            }),
            mangle: None,
            enclose: false,
            rename: false,
            wrap: false,
         },
         &ExtraOptions {
            unresolved_mark: self.main.metadata.unresolved_mark,
            top_level_mark: Mark::new(),
         },
      );

      #[allow(clippy::unwrap_used)]
      {
         block = program.expect_script().body[0]
            .as_mut_expr()
            .unwrap()
            .expr
            .as_mut_assign()
            .unwrap()
            .right
            .as_mut_fn_expr()
            .unwrap()
            .function
            .body
            .take()
            .unwrap();
      }
      return block;
   }

   fn search_for_nested(&mut self, block: &mut BlockStmt) -> bool {
      self.mode = Mode::SearchOnly(false);
      block.visit_mut_children_with(self);

      let mode = std::mem::replace(&mut self.mode, Mode::Transform);
      return matches!(mode, Mode::SearchOnly(true));
   }

   fn skipping(&self) -> bool {
      return matches!(&self.mode, Mode::SearchOnly(true));
   }

   fn search_only(&self) -> bool {
      return matches!(&self.mode, Mode::SearchOnly(_));
   }

   // TODO: Single assignment should be collapsed to reduce size.
   // TODO: Warn user that lz.block must be used inside a block statement.
   // For example:
   // `if (true) { var val = lz.block(() => { ... }) }` is OK, but
   // `if (true) var val = lz.block(() => { ... })` is not.
   // This is because we need the block to trigger `visit_mut_stmts`.
   fn visit_stmts_like(
      &mut self,
      mut stmts: Either<&mut Vec<Stmt>, &mut Vec<ModuleItem>>,
   ) {
      bail_if!(self.skipping() || for_both!(&stmts, s => s.is_empty()));

      if self.search_only() {
         return for_both!(stmts, s => s.visit_mut_children_with(self));
      }

      let mut block_stmts: Option<Vec<Stmt>> = None;
      let mut cursor = 0;

      'outer: loop {
         let mut inserted_temp_var = false;

         for_both!(stmts.as_mut(), stmts => {
            // Note: index is relative to the cursor (stmts[cursor..]).
            // The actual index is `idx + cursor`.
            for (idx, stmt) in stmts[cursor..].iter_mut().enumerate() {
               stmt.visit_mut_with(self);

               let mut block = unwrap_or!(self.block.take(), continue);

               if block.decl_kind == VarDeclKind::Const {
                  // `const` declarations require that the temp variable
                  // is declared then used to
                  // initialize the `const`.
                  block.stmts.insert(
                     0,
                     Stmt::Decl(utils::create_var_declaration(vec![block
                        .temp_var
                        .declarator
                        .clone()])),
                  );
                  cursor += idx;
                  inserted_temp_var = true;
               } else {
                  // Statements that are targeting a `let` declaration
                  // need to be placed after the
                  // declaration (1 more than the
                  // current index).
                  cursor = idx + cursor + 1;
               }
               block_stmts = Some(block.stmts);
               break;
            }
         });

         if let Some(mut block_stmts) = block_stmts.take() {
            match stmts.as_mut() {
               Left(stmts) => {
                  prepend!(stmts, block_stmts, cursor);
               }
               Right(stmts) => {
                  let mut block_stmts: Vec<ModuleItem> = block_stmts
                     .into_iter()
                     .map(|s| return ModuleItem::Stmt(s))
                     .collect();

                  prepend!(stmts, block_stmts, cursor);
               }
            }

            // Skip visiting the inserted temp var statement in the
            // next loop.
            if inserted_temp_var {
               cursor += 1;
            }
         } else {
            break 'outer;
         }
      }
   }

   // fn visit_stmts_like(
   //    &mut self,
   //    stmts: Either<&mut Vec<Stmt>, &mut Vec<ModuleItem>>,
   // ) { bail_if!(self.skipping() || for_both!(&stmts, s => s.is_empty()));

   //    if self.search_only() {
   //       return for_both!(stmts, s => s.visit_mut_children_with(self));
   //    }

   //    let mut block_stmts: Option<Vec<Stmt>> = None;
   //    let mut cursor = 0;

   //    // TODO: find a way to avoid this duplication.
   //    match stmts {
   //       Left(stmts) => {
   //          'outer: loop {
   //             let mut inserted_temp_var = false;
   //             // Note: index is relative to the cursor (stmts[cursor..]).
   //             // The actual index is `idx + cursor`.
   //             for (idx, stmt) in stmts[cursor..].iter_mut().enumerate() {
   //                stmt.visit_mut_with(self);

   //                let mut block = unwrap_or!(self.block.take(), continue);

   //                if block.decl_kind == VarDeclKind::Const {
   //                   // `const` declarations require that the temp variable
   //                   // is declared then used to
   //                   // initialize the `const`.
   //                   block.stmts.insert(
   //                      0,
   //                      Stmt::Decl(utils::create_var_declaration(vec![block
   //                         .temp_var
   //                         .declarator
   //                         .clone()])),
   //                   );
   //                   cursor += idx;
   //                   inserted_temp_var = true;
   //                } else {
   //                   // Statements that are targeting a `let` declaration
   //                   // need to be placed after the
   //                   // declaration (1 more than the
   //                   // current index).
   //                   cursor = idx + cursor + 1;
   //                }

   //                block_stmts = Some(block.stmts);
   //                break;
   //             }

   //             if let Some(mut block_stmts) = block_stmts.take() {
   //                prepend!(stmts, block_stmts, cursor);

   //                // Skip visiting the inserted temp var statement in the
   //                // next loop.
   //                if inserted_temp_var {
   //                   cursor += 1;
   //                }
   //             } else {
   //                break 'outer;
   //             }
   //          }
   //       }
   //       Right(stmts) => {
   //          'outer: loop {
   //             let mut inserted_temp_var = false;
   //             // Note: index is relative to the cursor (stmts[cursor..]).
   //             // The actual index is `idx + cursor`.
   //             for (idx, stmt) in stmts[cursor..].iter_mut().enumerate() {
   //                stmt.visit_mut_with(self);

   //                let mut block = unwrap_or!(self.block.take(), continue);

   //                if block.decl_kind == VarDeclKind::Const {
   //                   // `const` declarations require that the temp variable
   //                   // is declared then used to
   //                   // initialize the `const`.
   //                   block.stmts.insert(
   //                      0,
   //                      Stmt::Decl(utils::create_var_declaration(vec![block
   //                         .temp_var
   //                         .declarator
   //                         .clone()])),
   //                   );
   //                   cursor += idx;
   //                   inserted_temp_var = true;
   //                } else {
   //                   // Statements that are targeting a `let` declaration
   //                   // need to be placed after the
   //                   // declaration (1 more than the
   //                   // current index).
   //                   cursor = idx + cursor + 1;
   //                }

   //                block_stmts = Some(block.stmts);
   //                break;
   //             }

   //             if let Some(block_stmts) = block_stmts.take() {
   //                let mut block_stmts: Vec<ModuleItem> = block_stmts
   //                   .into_iter()
   //                   .map(|s| return ModuleItem::Stmt(s))
   //                   .collect();
   //                prepend!(stmts, block_stmts, cursor);

   //                // Skip visiting the inserted temp var statement in the
   //                // next loop.
   //                if inserted_temp_var {
   //                   cursor += 1;
   //                }
   //             } else {
   //                break 'outer;
   //             }
   //          }
   //       }
   //    }
   // }
}

impl VisitMut for LazyBlockVisitor<'_> {
   noop_visit_mut_type!();

   fn visit_mut_stmts(&mut self, stmts: &mut Vec<Stmt>) {
      self.visit_stmts_like(Left(stmts));
   }

   fn visit_mut_module_items(&mut self, module_items: &mut Vec<ModuleItem>) {
      self.visit_stmts_like(Right(module_items));
   }

   fn visit_mut_call_expr(&mut self, call_expr: &mut CallExpr) {
      bail_if!(self.skipping());

      // With blocks we want to transform the outermost block first to make
      // the analysis easier. Therefore, we skip visiting the children if a
      // block was found and will visit them later.

      if let Some(method) = self.main.find_lazy_method(call_expr) {
         if method.kind == LzMethodKind::Block {
            if self.search_only() {
               return self.mode = Mode::SearchOnly(true);
            }
            return self.handle_block(call_expr, &method);
         }
      }

      call_expr.visit_mut_children_with(self);
   }

   fn visit_mut_var_decl(&mut self, var_decl: &mut VarDecl) {
      bail_if!(self.skipping());

      if self.search_only() {
         return var_decl.visit_mut_children_with(self);
      }

      let declarations = &mut var_decl.decls;
      let is_single_decl = declarations.len() == 1;

      // Visit declarations and check if a lazy block was found.
      for declarator in declarations {
         declarator.visit_mut_with(self);

         let block = unwrap_or!(self.block.as_mut(), continue);
         block.decl_kind = var_decl.kind;

         swc_assert!(
            is_single_decl,
            var_decl.span,
            ("Multiple declarations are not supported when initalizing a \
              `block`. Example: `let a = lz.block(() => {{ ... }});` is OK, \
              but `let a = 1, b = lz.block(() => {{ ... }});` is not.")
         );

         if var_decl.kind == VarDeclKind::Const {
            // The decl is a `const`, we cannot mutate the variable so we must
            // initialize the declarator using the temp identifier.
            return declarator.init =
               Some(Box::new(Expr::Ident(block.temp_var.get_ident())));
         }
         // The decl is a `let`, we can replace the temp identifer with the
         // actual declarator's identifier since we can mutate the variable.
         let actual_ident = swc_unwrap!(
            declarator.name.as_ident(),
            var_decl.span,
            ("The LHS of a variable declaration that is initalized using a \
              `block` must be a named identifier. Destructuring patterns are \
              not supported.")
         );
         let block_id = block.temp_var.get_ident().to_id();

         for stmt in &mut block.stmts {
            replace_ident(stmt, block_id.clone(), actual_ident);
         }
         declarator.init = None;
      }
   }
}

/// Replaces all `return` statements with an assignment to the `temp_var`,
/// followed by an optional `break` statement if we are inside a breakable
/// statement (e.g. loop, switch, labeled statement).
mod inline_transform {
   use super::*;

   #[derive(Debug, Default)]
   pub struct Visitor {
      pub temp_var: LazyVar,
      /// Inserting a break is not equivalent to a return when we're inside a
      /// nested breakable statement. To overcome this we will need to add a
      /// label to the uppermost breakable statement to break to.
      return_label: Option<BlockLabel>,
      /// Whether we should insert a break after the current statement.
      insert_break: bool,
      /// This is incremented when we enter a breakable statement and
      /// decremented when exited.
      ///
      /// If we are inside a breakable statement, we need to insert a break on
      /// encountering a return statement.
      ///
      /// If we are inside a nested breakable statement, we cannot simply
      /// insert a break on encountering a return statement. To overcome
      /// this we will need to add a label to the uppermost breakable statement
      /// to break to.
      breakable_scope: u16,
   }

   macro_rules! visit_mut_breakable {
      ($( [$name:ident, $N:tt] ),+) => {
         $(
            #[save_state(breakable_scope)]
            fn $name(&mut self, n: &mut $N) {
               self.breakable_scope += 1;
               n.visit_mut_children_with(self);
            }
         )*
      };
   }

   // TODO: inserting a break is not equivalent to a return when we're inside a
   // nested breakable statement. To overcome this we will need to add a label
   // to the uppermost breakable statement to break to.
   impl VisitMut for Visitor {
      noop_visit_mut_block_ignored!();

      visit_mut_breakable!(
         [visit_mut_labeled_stmt, LabeledStmt],
         [visit_mut_do_while_stmt, DoWhileStmt],
         [visit_mut_for_stmt, ForStmt],
         [visit_mut_for_in_stmt, ForInStmt],
         [visit_mut_for_of_stmt, ForOfStmt],
         [visit_mut_while_stmt, WhileStmt]
      );

      fn visit_mut_stmt(&mut self, stmt: &mut Stmt) {
         stmt.visit_mut_children_with(self);

         let replaced = replace_return(stmt, &self.temp_var.ident);

         if replaced {
            self.insert_break = self.breakable_scope > 0;

            if self.breakable_scope > 1 {
               // TODO: this may be optimized by adding `n` break statements
               // after the nested statement at a `breakable_scope` of `n`,
               // instead of requiring a label.
               //
               // We are inside a nested breakable statement, a break here is
               // not equivalent to a return. We need to add a label to the
               // uppermost breakable statement to break to.

               if self.return_label.is_none() {
                  // Create a new label.
                  self.return_label = Some(BlockLabel::new());
               }
            }
         }

         if self.breakable_scope == 0 {
            if let Some(return_label) = self.return_label.take() {
               // We must now assign the required label to this statement.
               *stmt = Stmt::Labeled(LabeledStmt {
                  span: DUMMY_SP,
                  label: return_label.ident,
                  body: Box::new(stmt.take()),
               });
            }
         }
      }

      #[save_state(insert_break)]
      fn visit_mut_stmts(&mut self, stmts: &mut Vec<Stmt>) {
         self.insert_break = false;

         if self.breakable_scope > 0 {
            let mut insert_breaks_at: Vec<usize> = Vec::new();

            for (idx, stmt) in stmts.iter_mut().enumerate() {
               stmt.visit_mut_with(self);

               if self.insert_break {
                  // Insert `break` after the current statement.
                  insert_breaks_at.push(idx + 1);
               }
            }

            for (offset, at) in insert_breaks_at.iter().enumerate() {
               // The label is only required if we are inside a nested scope.
               let label = if self.breakable_scope > 1 {
                  self.return_label.as_ref().map(|l| return l.ident.clone())
               } else {
                  None
               };

               stmts.insert(
                  offset + at,
                  Stmt::Break(BreakStmt {
                     span: DUMMY_SP,
                     label,
                  }),
               );
            }
         } else {
            stmts.visit_mut_children_with(self);
         }
      }

      #[save_state(breakable_scope)]
      fn visit_mut_switch_stmt(&mut self, switch_stmt: &mut SwitchStmt) {
         self.breakable_scope += 1;
         visit_switch_stmt(self, switch_stmt);
      }
   }
}

/// Wraps all statements within a labeled statement and replaces all `return`
/// statements with an assignment to the `temp_var`, followed by a `break`
/// statement with a label to exit the wrapper labeled statement.
mod wrapped_transform {
   use super::*;

   #[derive(Debug, Default)]
   pub struct Visitor {
      pub temp_var: LazyVar,
      block_label: BlockLabel,
      insert_break: bool,
      depth: usize,
   }

   impl VisitMut for Visitor {
      noop_visit_mut_block_ignored!();

      fn visit_mut_stmt(&mut self, stmt: &mut Stmt) {
         stmt.visit_mut_children_with(self);

         let replaced = replace_return(stmt, &self.temp_var.ident);
         self.insert_break = replaced;
      }

      #[save_state(insert_break)]
      fn visit_mut_stmts(&mut self, stmts: &mut Vec<Stmt>) {
         self.depth += 1;
         self.insert_break = false;

         let mut insert_breaks_at: Vec<usize> = Vec::new();

         for (idx, stmt) in stmts.iter_mut().enumerate() {
            stmt.visit_mut_with(self);

            if self.insert_break {
               // Insert `break` after the current statement.
               insert_breaks_at.push(idx + 1);
            }
         }

         for (offset, at) in insert_breaks_at.iter().enumerate() {
            stmts.insert(
               offset + at,
               Stmt::Break(BreakStmt {
                  span: DUMMY_SP,
                  label: Some(self.block_label.ident.clone()),
               }),
            );
         }

         self.depth -= 1;

         if self.depth == 0 {
            // Wrap the statements with a labeled statement.
            let block_stmts = stmts.take();

            stmts.insert(
               0,
               Stmt::Labeled(LabeledStmt {
                  span: DUMMY_SP,
                  label: self.block_label.ident.clone(),
                  body: Box::new(Stmt::Block(BlockStmt {
                     span: DUMMY_SP,
                     stmts: block_stmts,
                  })),
               }),
            );
         }
      }

      fn visit_mut_switch_stmt(&mut self, switch_stmt: &mut SwitchStmt) {
         visit_switch_stmt(self, switch_stmt);
      }
   }
}

/// Replaces a `return` statement with an assignment to an identifier.
///
/// Returns `true` if the statement was replaced.
fn replace_return<'a>(stmt: &'a mut Stmt, assign_to: &'a Ident) -> bool {
   if let Stmt::Return(ReturnStmt {
      arg,
      ..
   }) = stmt
   {
      let expr = if let Some(arg) = arg {
         // `return <arg>;` => `<arg>`
         arg.clone()
      } else {
         // `return;` => `undefined`
         undefined(DUMMY_SP)
      };
      // `temp_var = <expr>;`
      let assignment = Box::new(
         expr.make_assign_to(op!("="), assign_to.clone().as_pat_or_expr()),
      );

      *stmt = Stmt::Expr(ExprStmt {
         span: DUMMY_SP,
         expr: assignment,
      });
      return true;
   }
   return false;
}

fn visit_switch_stmt<T: VisitMut>(
   visitor: &mut T,
   switch_stmt: &mut SwitchStmt,
) {
   for case in &mut switch_stmt.cases {
      // The consequent can be a vector of statements, or a vector containing
      // a single block statement. We don't want to trigger `visit_mut_stmts`
      // for the vector containing a single block, but on the `stmts` of said
      // block.
      if case.cons.len() == 1 {
         let stmt = &mut case.cons[0];

         if let Some(block_stmt) = stmt.as_mut_block() {
            block_stmt.stmts.visit_mut_with(visitor);
            continue;
         }
      }

      if !case.cons.is_empty() {
         case.cons.visit_mut_with(visitor);
      }
   }
}
