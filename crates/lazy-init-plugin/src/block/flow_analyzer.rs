use swc_ecma_ast::*;
use swc_ecma_visit::{noop_visit_type, Visit, VisitWith};

use super::*;
use context::Context;

union_enum!(
   TargetNode,
   DoWhile(DoWhileStmt),
   For(ForStmt),
   ForIn(ForInStmt),
   ForOf(ForOfStmt),
   While(WhileStmt),
   Labeled(LabeledStmt),
   Switch(SwitchStmt),
   Try(TryStmt)
);

#[derive(Debug, Default)]
struct LabelScope {
   kind: LabelScopeKind,
   label: Option<Ident>,
   is_target: bool,
}

#[derive(Clone, Copy, Debug, Default, PartialEq)]
enum LabelScopeKind {
   #[default]
   None,
   Labeled,
   Loop,
   Switch,
}

impl LabelScopeKind {
   pub fn from_stmt(stmt: &Stmt) -> Self {
      return match stmt {
         Stmt::DoWhile(_) |
         Stmt::For(_) |
         Stmt::ForIn(_) |
         Stmt::ForOf(_) |
         Stmt::While(_) => Self::Loop,
         Stmt::Labeled(_) => Self::Labeled,
         Stmt::Switch(_) => Self::Switch,
         _ => Self::None,
      };
   }
}

macro_rules! impl_visit {
   ($method:ident) => {
      fn $method(&self, v: &mut V) {
         match self {
            TargetNode::DoWhile(n) => n.$method(v),
            TargetNode::For(n) => n.$method(v),
            TargetNode::ForIn(n) => n.$method(v),
            TargetNode::ForOf(n) => n.$method(v),
            TargetNode::While(n) => n.$method(v),
            TargetNode::Labeled(n) => n.$method(v),
            TargetNode::Switch(n) => n.$method(v),
            TargetNode::Try(n) => n.$method(v),
         }
      }
   };
}

impl<V> VisitWith<V> for TargetNode<'_>
where
   V: ?Sized + Visit,
{
   impl_visit!(visit_with);

   impl_visit!(visit_children_with);
}

/// Analyzes the control flow of a node.
///
/// ## Arguments
///
/// * `node` - The target node to analyze.
pub fn analyze_flow(node: TargetNode) -> FlowAnalyzer {
   let mut v = FlowAnalyzer::new();

   match node {
      // TODO(maybe): If the body is another labeled statement, this will
      // cause issues. Why would you ever do that though?
      TargetNode::Labeled(node) => {
         let label_scope = v.label_scope.get_mut();

         label_scope.kind = LabelScopeKind::Labeled;
         label_scope.is_target = true;
         label_scope.label = Some(node.label.clone());

         v.target_label = Some(node.label.clone());
         v.is_breakable_stmt = true;
         v.is_loop_stmt = utils::is_loop_stmt(&node.body);

         node.body.visit_children_with(&mut v);
      }
      TargetNode::Switch(node) => {
         let label_scope = v.label_scope.get_mut();

         label_scope.kind = LabelScopeKind::Switch;
         label_scope.is_target = true;
         v.is_breakable_stmt = true;

         node.visit_children_with(&mut v);
      }
      TargetNode::Try(node) => {
         // Visit the try block first.
         v.is_try_block = true;
         node.block.visit_children_with(&mut v);

         // Visit the handler and finalizer.
         v.is_try_block = false;

         if let Some(h) = node.handler.as_ref() {
            h.visit_with(&mut v);
         }
         if let Some(f) = node.finalizer.as_ref() {
            f.visit_with(&mut v);
         }
      }
      _ => {
         v.is_breakable_stmt = true;
         v.is_loop_stmt = true;
         node.visit_children_with(&mut v);
      }
   };

   return v;
}

/// A count of the jump statements (`return` or `break` or `continue` or
/// `throw`) found and the scope they exit.
#[derive(Debug, Default, PartialEq)]
pub struct JumpStmtCount {
   /// Total count of jumps found in the target node.
   pub total: u16,
   /// No. of jumps that directly exit the target node's scope.
   pub target_scope: u16,
   /// No. of jumps that exit a nested scope within the target node.
   pub nested_scope: u16,
   /// No. of jumps that exit a parent scope outside of the target node.
   ///
   /// This includes cases where the jump is located in what appears to be the
   /// target scope, but the target node does not "control" the jump:
   ///
   /// * a `break` using a label that is not attached to or defined within the
   ///   target node.
   ///
   /// * a `break` in the target scope, but the target node is an `if`
   ///   statement, the break must refer to a parent scope since it's unknown
   ///   where the break will exit to.
   ///
   /// * a `continue` in the target scope, but the target node is a `switch`
   ///   statement, the continue must refer to a parent scope since a continue
   ///   cannot be used to exit a switch statement.
   ///
   /// * a `throw` in the target scope, but the target node is either not a
   ///   `try` statement or we are within its `catch` block, the throw will not
   ///   be caught by the target node and will exit a parent scope.
   pub parent_scope: u16,
}

#[derive(Clone, Copy, Debug, PartialEq)]
enum JumpStmtScope {
   Target,
   Nested,
   Parent,
}

impl JumpStmtCount {
   /// Returns `true` if all of the jumps found only effect nested scopes.
   pub fn only_nested(&self) -> bool {
      return self.total == self.nested_scope;
   }

   /// Returns `true` if the jumps found disrupt the flow of the target node.
   pub fn disrupts_flow(&self) -> bool {
      return self.total > 0 && !self.only_nested();
   }

   fn add(&mut self, scope: JumpStmtScope) {
      self.total += 1;

      match scope {
         JumpStmtScope::Target => {
            self.target_scope += 1;
         }
         JumpStmtScope::Nested => {
            self.nested_scope += 1;
         }
         JumpStmtScope::Parent => {
            self.parent_scope += 1;
         }
      }
   }
}

/// Counts the number of returns, breaks, and continues found within a
/// statement. The `coupled_*` fields count only the breaks and continues that
/// would cause the statement (that this analyzer was used to visit) to exit.
///
/// For example:
///
/// ```js
/// // Example A: { breaks: 2, coupled_breaks: 1 }
/// // Called on the `WhileStmt` node.
/// while (true) {
///    // ...
///    for (;;) {
///       // ...
///       break; // not coupled
///    }
///    break; // is coupled
/// }
///
/// // Example B: { breaks: 3, coupled_breaks: 2 }
/// // Called on the `WhileStmt` node with label `outer`.
/// outer: while (true) {
///    // ...
///    for (;;) {
///       if (cond) {
///         break outer; // is coupled
///       }
///       break; // not coupled
///    }
///    break; // is coupled
/// }
/// ```
#[derive(Debug, Default)]
pub struct FlowAnalyzer {
   /// Whether the target node is a loop (or labeled loop).
   pub is_loop_stmt: bool,
   /// Whether the target node is a loop, switch or labeled statement.
   pub is_breakable_stmt: bool,
   /// Whether the target node is the try block of a try statement.
   pub is_try_block: bool,

   /// If the target node is the body of a labeled statement, this should be
   /// the associated label.
   pub target_label: Option<Ident>,
   /// Labels of labeled statements defined within the target node.
   pub labels_defined: Vec<Ident>,

   /// A count of the `return` statements found.
   /// Note that we only need to know the total count since for our use case,
   /// the scope of a return will never change (it will always be the target
   /// scope).
   pub returns: JumpStmtCount,
   /// A count of the `break` statements found.
   pub breaks: JumpStmtCount,
   /// A count of the `continue` statements found.
   pub continues: JumpStmtCount,
   /// A count of the `throw` statements found.
   pub throws: JumpStmtCount,

   label_scope: Context<LabelScope>,
   /// When a labeled statement is visited, this will be set if the body is a
   /// statement which is a `LabelScopeKind` that is not `None`.
   next_label: Option<Ident>,
   try_block_scope: u32,
}

impl FlowAnalyzer {
   pub fn new() -> Self {
      let mut v = Self::default();
      v.label_scope.enter();
      return v;
   }

   /// Simple check to determine if the target node has statements that disrupts
   /// the flow of the target node.
   pub fn disrupts_flow(&self) -> bool {
      return self.returns.total > 0 ||// Any number of returns will always affect the flow.
         self.breaks.disrupts_flow() ||
         self.continues.disrupts_flow() ||
         self.throws.disrupts_flow();
   }

   /// ### Important
   /// It's safe to use this to quickly determine if it's possible for the
   /// target node to fallthrough.
   ///
   /// However, a `false` return value **is not a guarantee** that it cannot
   /// fall through, further analysis is required.
   pub fn falls_through(&self) -> bool {
      // If there are no returns, we cannot be certain.
      bail_if!(self.returns.total == 0, false);
      // A break or continue in the target scope in the presence of a return
      // can cause the target node to fall through.
      return self.breaks.target_scope > 0 || self.continues.target_scope > 0;
   }

   // Determines which scope a break/continue with no label will exit.
   fn exits_which_scope(
      &self,
      label: Option<&Ident>,
      is_continue: bool,
   ) -> JumpStmtScope {
      if let Some(label) = label {
         return self.label_exits_which_scope(label);
      }
      let current_scope = self.label_scope.get();

      if current_scope.is_target {
         // We are still in the target scope.
         let target_scope = current_scope;

         if is_continue && target_scope.kind != LabelScopeKind::Loop {
            // The continue is in the target scope, however, the scope is not a
            // loop. The continue will exit the closest loop which must be a
            // parent scope.
            return JumpStmtScope::Parent;
         }

         if target_scope.kind == LabelScopeKind::None {
            // The target scope is not breakable. The break/continue must exit a
            // parent scope.
            return JumpStmtScope::Parent;
         }

         return JumpStmtScope::Target;
      }

      // We are in a nested scope. However, if this scope is not a loop and
      // `is_continue` is true, we could still exit the target or parent scope
      // since a continue will target the closest loop.
      let nested_scope = current_scope;

      if is_continue && nested_scope.kind != LabelScopeKind::Loop {
         // A continue is not valid within the current scope. Find the next
         // scope which is a loop.
         for scope in &self.label_scope {
            if scope.kind == LabelScopeKind::Loop {
               if scope.is_target {
                  return JumpStmtScope::Target;
               }
               return JumpStmtScope::Nested;
            }
         }
         // No valid scope found, the continue must target a parent scope.
         return JumpStmtScope::Parent;
      }
      return JumpStmtScope::Nested;
   }

   // Determines which scope a break/continue with a label will exit.
   fn label_exits_which_scope(&self, label: &Ident) -> JumpStmtScope {
      // Check if the label matches the target label.
      if let Some(target_label) = &self.target_label {
         if label == target_label {
            // The target label will always cause the target scope to be
            // exited no matter it's location.
            return JumpStmtScope::Target;
         }
      }

      // Check if the label was defined within the target node.
      let is_nested_label =
         self.labels_defined.iter().any(|l| return l == label);

      return if is_nested_label {
         JumpStmtScope::Nested
      } else {
         JumpStmtScope::Parent
      };
   }

   fn enter_label_scope(&mut self, kind: LabelScopeKind) {
      // This is defined if we are visiting the body of a labeled statement with
      // a valid `LabelScopeKind`.
      let label = self.next_label.take();

      self.label_scope.enter_with(LabelScope {
         kind,
         label,
         ..Default::default()
      });
   }

   fn exit_label_scope(&mut self) {
      self.label_scope.exit();
   }
}

macro_rules! visit_mut_loop {
   ($( [$name:ident, $N:tt] ),+) => {
      $(
         fn $name(&mut self, n: &$N) {
            self.enter_label_scope(LabelScopeKind::Loop);
            n.body.visit_with(self);
            self.exit_label_scope();
         }
      )*
   };
}

impl Visit for FlowAnalyzer {
   noop_visit_block_ignored!();

   visit_mut_loop!(
      [visit_do_while_stmt, DoWhileStmt],
      [visit_for_stmt, ForStmt],
      [visit_for_in_stmt, ForInStmt],
      [visit_for_of_stmt, ForOfStmt],
      [visit_while_stmt, WhileStmt]
   );

   fn visit_labeled_stmt(&mut self, labeled_stmt: &LabeledStmt) {
      let label = &labeled_stmt.label;
      let body_stmt = &*labeled_stmt.body;

      self.labels_defined.push(label.clone());
      self.next_label = Some(label.clone());

      // We don't want to update the label scope twice, so we avoid doing it for
      // statements that have a visit method which will do so.
      if LabelScopeKind::from_stmt(body_stmt) == LabelScopeKind::None {
         // This will consume `self.next_label` straight away.
         self.enter_label_scope(LabelScopeKind::Labeled);
         body_stmt.visit_with(self);
         self.exit_label_scope();
      } else {
         // The visit method will consume `self.next_label`.
         body_stmt.visit_with(self);
      }

      // Remove the label since it's no longer in scope.
      self.labels_defined.pop();
   }

   fn visit_switch_stmt(&mut self, switch_stmt: &SwitchStmt) {
      self.enter_label_scope(LabelScopeKind::Switch);
      switch_stmt.cases.visit_with(self);
      self.exit_label_scope();
   }

   fn visit_try_stmt(&mut self, try_stmt: &TryStmt) {
      self.try_block_scope += 1;
      try_stmt.block.visit_with(self);
      self.try_block_scope -= 1;

      try_stmt.handler.visit_with(self);
      try_stmt.finalizer.visit_with(self);
   }

   fn visit_break_stmt(&mut self, break_stmt: &BreakStmt) {
      let scope = self.exits_which_scope(break_stmt.label.as_ref(), false);

      self.breaks.add(scope);
   }

   fn visit_continue_stmt(&mut self, continue_stmt: &ContinueStmt) {
      let scope = self.exits_which_scope(continue_stmt.label.as_ref(), true);

      self.continues.add(scope);
   }

   fn visit_return_stmt(&mut self, _: &ReturnStmt) {
      // For our use case, the scope will always be the target scope.
      self.returns.add(JumpStmtScope::Target);
   }

   fn visit_throw_stmt(&mut self, _: &ThrowStmt) {
      if self.try_block_scope == 0 {
         // We are within the target scope, the target node must be a try block
         // to exit the target scope. Otherwise, this throw is not caught and
         // will exit a parent scope.
         self.throws.add(if self.is_try_block {
            JumpStmtScope::Target
         } else {
            JumpStmtScope::Parent
         });
      } else {
         // We are within a nested scope, this throw will always be caught by a
         // nested try block.
         self.throws.add(JumpStmtScope::Nested);
      }
   }
}

#[allow(clippy::needless_pass_by_value)]
#[cfg(test)]
mod flow_analyzer_test {
   use swc_common::Spanned;

   use super::*;
   use crate::tests::{run_test, TestInput};

   fn fixtures() -> [(&'static str, &'static str, FlowAnalyzer); 2] {
      return [
         (
            "a.ts",
            "
            for (let i = 0; i < arr.length; i++) {
               someFn(i);
            }
            ",
            FlowAnalyzer {
               ..Default::default()
            },
         ),
         (
            "b.ts",
            "
            switch (val) {
               case 1:
                  break;
               case 2:
                  return;
               case 3:
                  throw new Error();
               default: {
                  let i = 0;
                  while (i < 10) {
                     i++;
                     if (cond) continue;
                     someFn(i);
                  }
               }
            }
            ",
            FlowAnalyzer {
               returns: JumpStmtCount {
                  total: 1,
                  target_scope: 1,
                  ..Default::default()
               },
               breaks: JumpStmtCount {
                  total: 1,
                  target_scope: 1,
                  ..Default::default()
               },
               continues: JumpStmtCount {
                  total: 1,
                  nested_scope: 1,
                  ..Default::default()
               },
               throws: JumpStmtCount {
                  total: 1,
                  parent_scope: 1,
                  ..Default::default()
               },
               ..Default::default()
            },
         ),
      ];
   }

   fn run_test_fixture(input: TestInput, expected: FlowAnalyzer) {
      run_test(input, |filepath, module| {
         let main = &module.body[0];

         if let ModuleItem::Stmt(Stmt::Decl(Decl::Fn(decl))) = main {
            let block_stmt = decl
               .function
               .body
               .as_ref()
               .expect("expected block statement");
            let stmt = &block_stmt.stmts[0];

            let target_node = match stmt {
               Stmt::DoWhile(stmt) => TargetNode::DoWhile(stmt),
               Stmt::For(stmt) => TargetNode::For(stmt),
               Stmt::ForIn(stmt) => TargetNode::ForIn(stmt),
               Stmt::ForOf(stmt) => TargetNode::ForOf(stmt),
               Stmt::While(stmt) => TargetNode::While(stmt),
               Stmt::Labeled(stmt) => TargetNode::Labeled(stmt),
               Stmt::Switch(stmt) => TargetNode::Switch(stmt),
               Stmt::Try(stmt) => TargetNode::Try(stmt),
               _ => unreachable!(),
            };
            let result = analyze_flow(target_node);

            if result.breaks == expected.breaks &&
               result.continues == expected.continues &&
               result.returns == expected.returns &&
               result.throws == expected.throws
            {
               return Ok(());
            }

            return Result::Err((
               format!(
                  "~~~ File: {filepath} ~~~\nThe result of `analyze_flow()` \
                   does not match the expected result. \n\nExpected: \
                   {expected:#?}\n\nActual: {result:#?}"
               ),
               Some(stmt.span()),
            ));
         }
         return Ok(());
      });
   }

   #[test]
   fn test_analyze_flow() {
      for fixture in fixtures() {
         let src = "function main() {\n".to_owned() + fixture.1 + "\n}";

         run_test_fixture(
            TestInput::Source(fixture.0.to_owned(), src),
            fixture.2,
         );
      }
   }
}
