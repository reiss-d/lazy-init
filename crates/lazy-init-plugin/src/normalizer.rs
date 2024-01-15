use super::*;
use swc_common::{util::take::Take, DUMMY_SP};
use swc_ecma_ast::*;
use swc_ecma_visit::{noop_visit_mut_type, VisitMut, VisitMutWith};

/// Normalizes AST to always contain a block statement where a single statement
/// or block statement is expected.
///
/// This allows us to insert statements before/after other statements easily
/// using `visit_mut_stmts`.
///
/// Example:
/// ```js
/// if (condition) return 1;
/// // is transformed to:
/// if (condition) { return 1; }
///
/// for (;;) c++;
/// // is transformed to:
/// for (;;) { c++; }
/// ```
pub struct Normalizer {}

pub fn normalize_block(mut block_stmt: BlockStmt) -> BlockStmt {
   let mut v = Normalizer {};
   block_stmt.visit_mut_with(&mut v);
   return block_stmt;
}

pub fn wrap_with_block(stmt: &mut Stmt) -> &mut Stmt {
   if !matches!(stmt, Stmt::Block(_)) {
      *stmt = Stmt::Block(BlockStmt {
         span: DUMMY_SP,
         stmts: vec![stmt.take()],
      });
   }
   return stmt;
}

impl VisitMut for Normalizer {
   noop_visit_mut_block_ignored!();

   fn visit_mut_stmt(&mut self, stmt: &mut Stmt) {
      stmt.visit_mut_children_with(self);

      let body = match stmt {
         Stmt::If(stmt) => {
            wrap_with_block(&mut *stmt.cons);

            return if let Some(alt) = stmt.alt.as_mut() {
               wrap_with_block(&mut **alt);
            };
         }
         Stmt::DoWhile(stmt) => &mut *stmt.body,
         Stmt::For(stmt) => &mut *stmt.body,
         Stmt::ForIn(stmt) => &mut *stmt.body,
         Stmt::ForOf(stmt) => &mut *stmt.body,
         Stmt::While(stmt) => &mut *stmt.body,
         Stmt::With(stmt) => &mut *stmt.body,
         _ => return,
      };

      wrap_with_block(body);
   }
}
