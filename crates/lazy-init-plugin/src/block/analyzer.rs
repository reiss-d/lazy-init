use swc_common::{Span, Spanned, DUMMY_SP};
use swc_ecma_ast::*;
use swc_ecma_visit::{noop_visit_mut_type, VisitMut, VisitMutWith};
use tracing::debug;
use visitor_state_macro::save_state;

use super::*;
use context::Context;
use flow_analyzer::{analyze_flow, TargetNode};
use stmt_context::{Flags, StmtCtx, StmtType};

#[derive(Debug)]
pub struct AnalyzeOk {
   /// The type of transformation that should be applied to the block.
   pub transform_type: TransformType,
   /// If analysis finished early, this is not the top level context.
   pub final_ctx: StmtCtx,
}

#[derive(Debug)]
pub struct AnalyzeError {
   pub msg: String,
   pub span: Option<Span>,
}

type AnalyzeResult = Result<AnalyzeOk, AnalyzeError>;

/// Analyzes a block statement and returns the type of transformation that
/// should be applied to it. See [`TransformType`].
///
/// ### Arguments
/// * `block_stmt` - Must be the variant [`Stmt::Block`].
///
/// ### Errors
/// There are multiple reasons why analysis may fail, and the error message
/// should be descriptive enough to indicate the cause.
///
/// ### Notes
/// Current limitations:
/// * If a [`DoWhileStmt`] or [`LabeledStmt`] that disrupts the flow is
///   encountered, the block is wrapped.
pub fn analyze(block_stmt: &mut Stmt) -> AnalyzeResult {
   debug_assert!(
      matches!(block_stmt, Stmt::Block(_)),
      "Called `analyze()` with a statement that is not the variant \
       `Stmt::Block`."
   );

   let mut analyzer = Analyzer::new();
   block_stmt.visit_mut_with(&mut analyzer);

   return analyzer.result.expect("Result should exist.");
}

#[derive(Debug, Default, PartialEq)]
pub enum TransformType {
   /// The block contains statements that can be inlined.
   #[default]
   Inline,
   /// The block contains statements that cannot easily be inlined and must be
   /// wrapped in a labeled statement.
   Wrapped,
}

#[derive(Debug, Default)]
struct Analyzer {
   pub result: Option<AnalyzeResult>,
   /// The label of a [`LabeledStmt`] that is currently being visited.
   pub label: Option<Ident>,

   ctx: Context<StmtCtx>,
   /// Required for when the `then` branch in an [`IfStmt`] has been visited
   /// but we have transformed the statement by adding an `else` branch.
   next_if_then_stmts: Option<Vec<StmtCtx>>,
   depth: usize,
   finished: bool,
   is_top_level: bool,
   inside_else_branch: bool,
   inside_try_block: bool,
}

impl Analyzer {
   pub fn new() -> Self {
      let mut analyzer = Self {
         is_top_level: true,
         ..Analyzer::default()
      };
      // Enter top level block.
      analyzer.ctx.enter_with(StmtCtx {
         kind: StmtType::TopLevel,
         ..Default::default()
      });
      return analyzer;
   }

   fn stmt(&self) -> &StmtCtx {
      return self.ctx.get();
   }

   fn stmt_mut(&mut self) -> &mut StmtCtx {
      return self.ctx.get_mut();
   }

   fn set_kind(&mut self, block_type: StmtType) {
      self.stmt_mut().kind = block_type;
   }

   fn get_mut_children(&mut self) -> &mut Vec<StmtCtx> {
      return match self.stmt().kind {
         StmtType::If => {
            let stmts = if self.inside_else_branch {
               self.stmt_mut().else_stmts.as_mut()
            } else {
               self.stmt_mut().then_stmts.as_mut()
            };
            // Initialized in `visit_if_stmt`.
            stmts.expect("unreachable")
         }
         _ => self.stmt_mut().children.as_mut(),
      };
   }

   /// A return value of `true` indicates that further analysis of the statement
   /// is not needed.
   fn fast_path(&mut self, node: TargetNode) -> bool {
      let result = analyze_flow(node);

      if !result.disrupts_flow() {
         self.stmt_mut().add(Flags::NO_FLOW_IMPACT);
         return true;
      }

      if result.falls_through() {
         self.stmt_mut().add(Flags::FALLS_THROUGH);
         self.finish_early();
         return true;
      }

      return false;
   }

   fn analyze_stmt(&mut self) {
      bail_if!(self.finished);
      self.stmt_mut().compute();

      if self.stmt().has(Flags::FALLS_THROUGH) {
         return self.finish_early();
      }
      if self.stmt().kind == StmtType::TopLevel {
         // Top level block must always return.
         // No return in the top level block is an error, which is handled in
         // `visit_stmt` and why we only finish early here if a return is
         // present.
         if self.stmt().has(Flags::RETURNS) &&
            !self.stmt().has(Flags::ALWAYS_RETURNS)
         {
            return self.finish_early();
         }
      }
   }

   /// Finish early if a fall through is detected. This is still considered a
   /// success but the transformation type will be [`TransformType::Wrapped`].
   fn finish_early(&mut self) {
      debug!("Finishing early.");
      self.success(TransformType::Wrapped);
      self.finished = true;
   }

   fn visit<T: VisitMutWith<Analyzer>>(
      &mut self,
      stmt: &mut T,
      kind: Option<StmtType>,
   ) {
      // Enter new context.
      self.ctx.enter();
      self.depth += 1;

      // Set the kind if it was provided by the parent.
      if let Some(kind) = kind {
         self.set_kind(kind);
      }

      // Analyze the statement.
      stmt.visit_mut_children_with(self);
      self.analyze_stmt();
      bail_if!(self.finished);

      // Exit the new context and append it as a child.
      self.depth -= 1;
      let ctx = self.ctx.exit();
      self.get_mut_children().push(ctx);
   }

   fn success(&mut self, transform_type: TransformType) {
      self.result.get_or_insert(Ok(AnalyzeOk {
         transform_type,
         final_ctx: self.ctx.exit(),
      }));
      self.finished = true;
   }

   fn failure(&mut self, error: AnalyzeError) {
      self.result.get_or_insert(Err(error));
      self.finish_early();
   }
}

impl VisitMut for Analyzer {
   noop_visit_mut_block_ignored!();

   fn visit_mut_stmts(&mut self, stmts: &mut Vec<Stmt>) {
      let mut current_idx = 0;

      loop {
         bail_if!(self.finished || current_idx >= stmts.len());

         let mut found_lonely_if = false;
         let last_idx = stmts.len() - 1;

         for (idx, stmt) in stmts[current_idx..].iter_mut().enumerate() {
            current_idx = idx;
            stmt.visit_mut_with(self);
            bail_if!(self.finished);

            // Find the first `if` with no `else` branch. If it's the last
            // statement there's no need for an `else` branch.
            if current_idx != last_idx {
               if let Some(latest) = self.get_mut_children().last() {
                  // TODO: check this assumption is correct in try-catch.
                  // Specify `RETURNS` since it's unnecessary if it always
                  // returns due to a throw.
                  let is_lonely_if = latest.kind == StmtType::If &&
                     latest.else_stmts.is_none() &&
                     latest.has(Flags::RETURNS) &&
                     latest.has(Flags::ALWAYS_RETURNS);

                  if is_lonely_if {
                     found_lonely_if = true;
                     break;
                  }
               }
            }
         }

         bail_if!(!found_lonely_if);

         // Remove the latest child which is expected to be an `if`.
         let if_ctx =
            self.get_mut_children().pop().expect("Child should exist.");
         debug_assert!(if_ctx.kind == StmtType::If);

         // Store the already computed `then` branch.
         self.next_if_then_stmts = if_ctx.then_stmts;

         // Create an `else` branch using the remaining statements.
         let else_block = Stmt::Block(BlockStmt {
            span: DUMMY_SP,
            stmts: stmts.drain((current_idx + 1)..stmts.len()).collect(),
         });

         // Add the `else` branch to the `if` statement.
         let if_stmt = &mut stmts[current_idx];
         if_stmt
            .as_mut_if_stmt()
            .expect("Should be an if statement.")
            .alt = Some(Box::new(else_block));
      }
   }

   fn visit_mut_stmt(&mut self, stmt: &mut Stmt) {
      bail_if!(self.finished);
      // These statements should never be visited.
      bail_if!(matches!(
         stmt,
         Stmt::Empty(_) |
            Stmt::Debugger(_) |
            Stmt::With(_) |
            Stmt::Decl(_) |
            Stmt::Expr(_)
      ));

      // Can only be the top level once.
      let is_top_level = self.is_top_level;
      self.is_top_level = false;

      // Visit the statement if this isn't the top level.
      if !is_top_level {
         return self.visit(stmt, None);
      }

      // Manually visit the underlying block so it's children are added directly
      // to the top level stmt context.
      let top_level_block = swc_unwrap!(
         stmt.as_mut_block(),
         stmt.span(),
         ("Top level statement is not a block.\n{:#?}", stmt)
      );
      top_level_block.visit_mut_children_with(self);

      // Analyze the top level block.
      self.analyze_stmt();
      bail_if!(self.finished);

      if !self.stmt().has(Flags::RETURNS) {
         return self.failure(AnalyzeError {
            msg: "A block must always contain a `return` statement.".to_owned(),
            span: Some(stmt.span()),
         });
      }

      let final_stmt = self.stmt().children.last();
      let valid_final_stmt = final_stmt.map_or(false, |s| {
         return s.has(Flags::ALWAYS_RETURNS) && !s.has(Flags::FALLS_THROUGH);
      });

      if valid_final_stmt {
         return self.success(TransformType::Inline);
      }
      return self.failure(AnalyzeError {
         msg: "The final statement in a block must always return a value."
            .to_owned(),
         span: Some(stmt.span()),
      });
   }

   fn visit_mut_block_stmt(&mut self, block_stmt: &mut BlockStmt) {
      self.set_kind(StmtType::Block);
      block_stmt.visit_mut_children_with(self);
   }

   #[save_state(inside_else_branch)]
   fn visit_mut_if_stmt(&mut self, if_stmt: &mut IfStmt) {
      self.set_kind(StmtType::If);
      self.inside_else_branch = false;

      // If the `then` branch has already been visited, this value will be
      // `Some` and we can skip visiting it again.
      if let Some(then_stmts) = self.next_if_then_stmts.take() {
         self.stmt_mut().then_stmts = Some(then_stmts);
      } else {
         // Initialize the `then_stmts`.
         self.stmt_mut().then_stmts.get_or_insert(Vec::new());

         // Visit the `then` branch.
         if_stmt.cons.visit_mut_with(self);
      }

      if let Some(alt) = &mut if_stmt.alt {
         // Initialize the `else_stmts`.
         self.stmt_mut().else_stmts.get_or_insert(Vec::new());

         // Visit the `else` branch.
         self.inside_else_branch = true;
         alt.visit_mut_with(self);
      }
   }

   fn visit_mut_switch_stmt(&mut self, switch_stmt: &mut SwitchStmt) {
      self.set_kind(StmtType::Switch);
      bail_if!(self.fast_path(switch_stmt.into()));

      let default_case_idx = switch_stmt
         .cases
         .iter()
         .position(|case| return case.test.is_none());

      if let Some(default_case_idx) = default_case_idx {
         // Default case must be the last case.
         swc_assert!(
            default_case_idx == (switch_stmt.cases.len() - 1),
            switch_stmt.span,
            ("The default case must come last in a `switch` statement within \
              a `lz.block`.")
         );
      }

      // Must manually `self.visit()` here as `visit_stmt` will not be called
      // since a `SwitchCase` is not an actual `Stmt`.
      for case in &mut switch_stmt.cases {
         bail_if!(self.finished);

         // Skip empty case statements.
         if !case.cons.is_empty() {
            self.visit(
               &mut case.cons,
               Some(if case.test.is_some() {
                  StmtType::SwitchCase
               } else {
                  StmtType::SwitchDefault
               }),
            );
         }
      }
   }

   fn visit_mut_labeled_stmt(&mut self, labeled_stmt: &mut LabeledStmt) {
      self.set_kind(StmtType::Labeled);
      bail_if!(self.fast_path(labeled_stmt.into()));

      let prev_label = self.label.replace(labeled_stmt.label.clone());
      self.stmt_mut().label = self.label.clone();

      //  labeled_stmt.visit_mut_children_with(self);
      self.label = prev_label;

      // TODO(feat=labels): Implement inlining `LabeledStmt`.
      // Currently, we do not attempt to inline labeled statements that disrupt
      // the flow. They're seldom used anyway and aren't a priority for
      // the time being.
      // Note this does not impact nested `lz.block` calls which will be
      // transformed into labeled statements, since blocks are transformed
      // top-down.
      return self.finish_early();
   }

   fn visit_mut_try_stmt(&mut self, try_stmt: &mut TryStmt) {
      self.set_kind(StmtType::Try);
      bail_if!(self.fast_path(try_stmt.into()));

      // Visit the `try` branch.
      let prev_inside_try_block = self.inside_try_block;
      self.inside_try_block = true;
      self.visit(
         &mut try_stmt.block.stmts,
         Some(StmtType::TryBlock),
      );
      self.inside_try_block = prev_inside_try_block;

      // Visit the `catch` branch.
      if let Some(catch_stmt) = &mut try_stmt.handler {
         self.visit(
            &mut catch_stmt.body.stmts,
            Some(StmtType::TryCatch),
         );
      }

      // Visit the `finally` branch.
      if let Some(finally_stmt) = &mut try_stmt.finalizer {
         // self.set_next_kind(StmtType::TryFinally);
         // finally.visit_mut_with(self);
         self.visit(
            &mut finally_stmt.stmts,
            Some(StmtType::TryFinally),
         );
      }
   }

   /* Visit loop statements */

   fn visit_mut_do_while_stmt(&mut self, do_while_stmt: &mut DoWhileStmt) {
      self.set_kind(StmtType::DoWhile);
      bail_if!(self.fast_path(do_while_stmt.into()));

      // TODO: implement inlining `DoWhileStmt`.
      self.finish_early();

      // let maybe_body;
      // let body = match &*do_while_stmt.body {
      //    Stmt::Block(block_stmt) => block_stmt,
      //    stmt => {
      //       maybe_body = Some(wrap_with_block(vec![stmt.clone()]));
      //       maybe_body.as_ref().expect("unreachable")
      //    }
      // };
      // let result = analyze_flow(body, None, self.inside_try_branch);
   }

   fn visit_mut_for_stmt(&mut self, for_stmt: &mut ForStmt) {
      self.set_kind(StmtType::For);
      bail_if!(self.fast_path(for_stmt.into()));
      for_stmt.visit_mut_children_with(self);
   }

   fn visit_mut_for_in_stmt(&mut self, for_in_stmt: &mut ForInStmt) {
      self.set_kind(StmtType::ForIn);
      bail_if!(self.fast_path(for_in_stmt.into()));
      for_in_stmt.visit_mut_children_with(self);
   }

   fn visit_mut_for_of_stmt(&mut self, for_of_stmt: &mut ForOfStmt) {
      self.set_kind(StmtType::ForOf);
      bail_if!(self.fast_path(for_of_stmt.into()));
      for_of_stmt.visit_mut_children_with(self);
   }

   fn visit_mut_while_stmt(&mut self, while_stmt: &mut WhileStmt) {
      self.set_kind(StmtType::While);
      bail_if!(self.fast_path(while_stmt.into()));
      while_stmt.visit_mut_children_with(self);
   }

   /* Visit jump statements */

   fn visit_mut_break_stmt(&mut self, _: &mut BreakStmt) {
      self.set_kind(StmtType::Break);
   }

   fn visit_mut_continue_stmt(&mut self, _: &mut ContinueStmt) {
      self.set_kind(StmtType::Continue);
   }

   fn visit_mut_throw_stmt(&mut self, _: &mut ThrowStmt) {
      self.set_kind(StmtType::Throw);
   }

   fn visit_mut_return_stmt(&mut self, _: &mut ReturnStmt) {
      self.set_kind(StmtType::Return);
   }
}
