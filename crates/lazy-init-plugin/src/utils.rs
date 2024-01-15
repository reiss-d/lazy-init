use super::*;
use swc_common::DUMMY_SP;
use swc_ecma_ast::*;
use swc_ecma_utils::{private_ident, ExprFactory};

#[derive(Debug, Clone)]
pub struct LazyVar {
   pub ident: Ident,
   pub declarator: VarDeclarator,
}

impl Default for LazyVar {
   fn default() -> Self {
      return Self::new();
   }
}

impl LazyVar {
   pub fn new() -> Self {
      let ident = Self::lazy_identifier();
      return Self {
         declarator: VarDeclarator {
            span: DUMMY_SP,
            name: Pat::Ident(BindingIdent {
               id: ident.clone(),
               type_ann: None,
            }),
            init: None,
            definite: false,
         },
         ident,
      };
   }

   pub fn lazy_identifier() -> Ident {
      #[cfg(test)]
      {
         return private_ident!("lzVar");
      }
      #[cfg(not(test))]
      {
         return private_ident!("lv");
      }
   }

   pub fn get_ident(&self) -> Ident {
      return self.ident.clone();
   }
}

#[derive(Debug, Clone)]
pub struct BlockLabel {
   pub ident: Ident,
}

impl Default for BlockLabel {
   fn default() -> Self {
      return Self::new();
   }
}

impl BlockLabel {
   pub fn new() -> Self {
      return Self {
         ident: Self::label_identifier(),
      };
   }

   pub fn label_identifier() -> Ident {
      #[cfg(test)]
      {
         return private_ident!("Block");
      }
      #[cfg(not(test))]
      {
         return private_ident!("b");
      }
   }

   pub fn get_ident(&self) -> Ident {
      return self.ident.clone();
   }
}

pub fn insert_item_after_imports(
   items: &mut Vec<ModuleItem>,
   to_insert: ModuleItem,
) {
   let idx = items
      .iter()
      .position(|item| {
         if let Some(Stmt::Expr(ExprStmt {
            expr,
            ..
         })) = item.as_stmt()
         {
            if matches!(&**expr, Expr::Lit(Lit::Str(..))) {
               return false;
            }
         };
         return !matches!(item.as_module_decl(), Some(ModuleDecl::Import(_)));
      })
      .unwrap_or(items.len());
   items.insert(idx, to_insert);
}

pub fn replace_identity_fn() -> Callee {
   return Ident {
      span: DUMMY_SP,
      sym: "".into(),
      optional: false,
   }
   .as_callee();
}

pub fn create_var_declaration(decls: Vec<VarDeclarator>) -> Decl {
   return Decl::Var(Box::new(VarDecl {
      span: DUMMY_SP,
      kind: VarDeclKind::Var,
      declare: false,
      decls,
   }));
}

/// Returns `true` if the statement is a loop.
pub fn is_loop_stmt(stmt: &Stmt) -> bool {
   return matches!(
      stmt,
      Stmt::DoWhile(_) |
         Stmt::For(_) |
         Stmt::ForIn(_) |
         Stmt::ForOf(_) |
         Stmt::While(_)
   );
}

/// Returns `true` if the statement is a loop, switch, or labeled statement.
pub fn is_breakable_stmt(stmt: &Stmt) -> bool {
   bail_if!(is_loop_stmt(stmt), true);

   return matches!(stmt, Stmt::Switch(_) | Stmt::Labeled(_));
}

pub fn join_str(a: impl Into<String>, b: impl Into<String>) -> String {
   let mut a: String = a.into();
   a.push_str(&b.into());
   return a;
}

pub fn get_stmt_kind(stmt: &Stmt) -> String {
   return match stmt {
      Stmt::Block(_) => "BlockStmt".into(),
      Stmt::Empty(_) => "EmptyStmt".into(),
      Stmt::Debugger(_) => "DebuggerStmt".into(),
      Stmt::With(_) => "WithStmt".into(),
      Stmt::Return(_) => "ReturnStmt".into(),
      Stmt::Labeled(_) => "LabeledStmt".into(),
      Stmt::Break(_) => "BreakStmt".into(),
      Stmt::Continue(_) => "ContinueStmt".into(),
      Stmt::If(_) => "IfStmt".into(),
      Stmt::Switch(_) => "SwitchStmt".into(),
      Stmt::Throw(_) => "ThrowStmt".into(),
      Stmt::Try(_) => "TryStmt".into(),
      Stmt::While(_) => "WhileStmt".into(),
      Stmt::DoWhile(_) => "DoWhileStmt".into(),
      Stmt::For(_) => "ForStmt".into(),
      Stmt::ForIn(_) => "ForInStmt".into(),
      Stmt::ForOf(_) => "ForOfStmt".into(),
      Stmt::Decl(_) => "DeclStmt".into(),
      Stmt::Expr(_) => "ExprStmt".into(),
   };
}

pub fn rand_string() -> String {
   #[cfg(any(test, not(feature = "use-plugin_transform")))]
   {
      return "uniquekey123".to_owned();
   }
   #[cfg(all(feature = "use-plugin_transform", not(test)))]
   {
      use rand::{distributions::Alphanumeric, thread_rng, Rng};

      return thread_rng()
         .sample_iter(&Alphanumeric)
         .take(12)
         .map(char::from)
         .collect();
   }
}
