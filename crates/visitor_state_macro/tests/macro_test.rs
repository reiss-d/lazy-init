#[test]
#[allow(dead_code, unused_variables)]
pub fn macro_test() {
   use visitor_state_macro::save_state;

   struct Visitor {
      is_inside_block: bool,
      is_inside_try: bool,
   }

   struct BlockStmt {
      stmts: Vec<u8>,
   }

   struct TryStmt {
      try_stmts: Vec<u8>,
      catch_stmts: Vec<u8>,
   }

   impl Visitor {
      #[save_state(is_inside_block)]
      pub fn visit_block_stmt(&mut self, block_stmt: &BlockStmt) {
         self.is_inside_block = true;
         // block_stmt.visit_children_with(self);
      }

      pub fn visit_try_stmt(&mut self, try_stmt: &TryStmt) {
         self.is_inside_try = true;
         // try_stmt.visit_children_with(self);
      }
   }

   let mut visitor = Visitor {
      is_inside_block: false,
      is_inside_try: false,
   };

   visitor.visit_block_stmt(&BlockStmt {
      stmts: vec![1, 2, 3],
   });
   assert!(
      !visitor.is_inside_block,
      "Expected `is_inside_block` to be `false`."
   );

   visitor.visit_try_stmt(&TryStmt {
      try_stmts: vec![1, 2, 3],
      catch_stmts: vec![4, 5, 6],
   });
   assert!(
      visitor.is_inside_try,
      "Expected `is_inside_try` to be `true`."
   );
}
