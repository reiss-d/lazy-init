use bitflags::bitflags;
use core::fmt::Debug;
use swc_ecma_ast::Ident;
use tracing::debug;

use super::*;
use Flags as F;

#[derive(Clone, Copy, Debug, Default, PartialEq)]
pub enum StmtType {
   #[default]
   Unknown,

   // Block-like.
   Block,
   Labeled,
   /// The block statement of the function passed to `lz.block`.
   /// ```ts
   /// let val = lz.block(() => /* block start */ {
   ///   // ...statements
   /// } /* block end */ );
   /// ```
   TopLevel,

   // Control flow.
   If,

   // Loops.
   For,
   ForIn,
   ForOf,
   While,
   DoWhile,

   // Switch-like.
   Switch,
   SwitchCase,
   SwitchDefault,

   // Try-like.
   Try,
   TryBlock,
   TryCatch,
   TryFinally,

   // Jumps.
   Break,
   Continue,
   Throw,
   Return,
}

/// The context of a statement.
/// Consider the following code:
/// ```ts
/// // `ends_with_return` is TRUE for this block.
/// {
///   return 1;
/// }
///
/// // However, placed in the context of another block
/// // inside an `If`, `ends_with_return` is now FALSE.
/// {
///   if (cond) {
///     return 1;
///   }
/// }
/// ```
#[derive(Clone, Default)]
pub struct StmtCtx {
   pub kind: StmtType,
   pub flags: Flags,
   /// The child statements within this statement.
   pub children: Vec<StmtCtx>,
   /// The label of a labeled statement that this statement is a child of.
   pub label: Option<Ident>,

   /// Only used for kind `StmtType::If`.
   pub then_stmts: Option<Vec<StmtCtx>>,
   /// Only used for kind `StmtType::If`.
   pub else_stmts: Option<Vec<StmtCtx>>,
}

impl StmtCtx {
   pub fn add(&mut self, flag: Flags) {
      self.flags.insert(flag);
   }

   #[allow(clippy::trivially_copy_pass_by_ref)]
   pub fn add_from(&mut self, other: &Flags, mask: Option<Flags>) {
      self.flags.add_from(other, mask);
   }

   pub fn rem(&mut self, flag: Flags) {
      self.flags.remove(flag);
   }

   pub fn has(&self, flag: Flags) -> bool {
      return self.flags.contains(flag);
   }

   pub fn has_any(&self, flag: Flags) -> bool {
      return self.flags.has_any(flag);
   }

   pub fn compute(&mut self) {
      // Fast path may have already computed the effect of this statement.
      bail_if!(self.has_any(F::NO_FLOW_IMPACT | F::FALLS_THROUGH));
      // A child falling through means this statement can fall through.
      bail_if!(
         self.child_has(F::FALLS_THROUGH),
         self.falls_through()
      );

      match self.kind {
         StmtType::Unknown => {
            unreachable!(
               "Attempted to compute the context of an unknown statement type."
            );
         }

         // Block-like.
         StmtType::Block => {
            self.compute_block();
         }
         StmtType::Labeled => {
            // TODO(feat=labels): Implement inlining `LabeledStmt`.
            // Currently we should only get here if we encounter a labeled
            // statement that have no flow impact.
            if !self.has(F::NO_FLOW_IMPACT) {
               todo!("Implement inlining `LabeledStmt`.");
            }
         }
         StmtType::TopLevel => {
            self.compute_block();

            // // Top level block must always return.
            // if !self.has(F::ALWAYS_RETURNS) {
            //    self.falls_through();
            // }
         }

         // Control flow.
         StmtType::If => {
            // If statement children are stored in `(then|else)_stmts`.
            debug_assert!(self.children.is_empty());

            let then_stmts = self
               .then_stmts
               .as_mut()
               .expect("If Statement is missing a then branch.");
            remove_unneeded_children(then_stmts);

            let then_flags = Self::compute_block_like_stmts(then_stmts);
            let (else_flags, else_exists) =
               if let Some(else_stmts) = self.else_stmts.as_mut() {
                  remove_unneeded_children(else_stmts);
                  (Self::compute_block_like_stmts(else_stmts), true)
               } else {
                  (F::default(), false)
               };

            // Copy the flags from each branch.
            self.add_from(&then_flags.union(else_flags), None);

            if !self.has_any(F::HAS_RETURN_LIKE) {
               return self.no_flow_impact();
            }

            if self.has(F::FALLS_THROUGH) {
               return self.falls_through();
            }

            if else_exists {
               // Both branches exist. Both must always return otherwise the if
               // statement can fall through.
               if !then_flags.has(F::ALWAYS_RETURNS) ||
                  !else_flags.has(F::ALWAYS_RETURNS)
               {
                  return self.falls_through();
               }
            }
         }

         // Loops.
         StmtType::For |
         StmtType::ForIn |
         StmtType::ForOf |
         StmtType::While |
         StmtType::DoWhile => {
            // TODO(feat=labels): This will need to be updated to handle labels.

            remove_unneeded_children(&mut self.children);

            if self.children.is_empty() {
               return self.no_flow_impact();
            }

            self.compute_block();

            let child_returns = self.child_has(F::RETURNS);

            if child_returns && self.child_has_any(F::BREAKS | F::CONTINUES) {
               // A break/continue in the presence of a return means the loop
               // can fall through.
               return self.falls_through();
            }

            if self.child_has(F::RETURNS) {
               // If any of the children break or continue, then the loop can
               // fall through.
               return self.falls_through();
            }

            // The loop will consume these flags.
            self.rem(F::BREAKS | F::CONTINUES);
         }

         // Switch-like.
         StmtType::Switch => {
            let mut has_default = false;
            let mut no_flow_impact = true;

            for child in &self.children {
               has_default |= child.kind == StmtType::SwitchDefault;
               no_flow_impact &= child.has(F::NO_FLOW_IMPACT);

               // TODO: this does not always apply to labeled breaks.
               // A break will be consumed by this switch statement, therefore
               // we don't need to copy it.
               self.flags.add_from(
                  &child.flags,
                  Some(F::CONTINUES | F::RETURNS | F::THROWS),
               );
            }

            if no_flow_impact {
               return self.no_flow_impact();
            }

            let has_return = self.has(F::RETURNS);

            if has_return {
               // A break/continue in the presence of a return means the switch
               // can fall through.
               if self.has_any(F::CONTINUES | F::BREAKS) {
                  return self.falls_through();
               }

               // If any of the children return, they all must always return. No
               // default case is considered missing a return.
               if !has_default || !self.children_have(F::ALWAYS_RETURNS) {
                  return self.falls_through();
               }

               return self.add(F::ALWAYS_RETURNS);
            }
         }
         StmtType::SwitchCase => {
            bail_if!(self.children.is_empty());
            self.compute_block();
         }
         StmtType::SwitchDefault => {
            bail_if!(self.children.is_empty());
            self.compute_block();
         }

         // Try-like.
         StmtType::Try => {
            // TODO: This section can be simplified.

            #[derive(Default)]
            struct TryBranchCtx {
               pub exists: bool,
               pub throws: bool,
               pub returns: bool,
               pub always_returns: bool,
            }

            let mut no_flow_impact = true;
            let mut block = TryBranchCtx::default();
            let mut catch = TryBranchCtx::default();
            let mut finally = TryBranchCtx::default();

            for child in &self.children {
               self
                  .flags
                  .add_from(&child.flags, Some(F::BREAKS | F::CONTINUES));

               no_flow_impact &= child.has(F::NO_FLOW_IMPACT);

               let branch = match child.kind {
                  StmtType::TryBlock => &mut block,
                  StmtType::TryCatch => &mut catch,
                  StmtType::TryFinally => &mut finally,
                  _ => unreachable!(
                     "Unknown child of try statement with kind: {:?}",
                     child.kind
                  ),
               };
               *branch = TryBranchCtx {
                  exists: true,
                  throws: child.has(F::THROWS),
                  returns: child.has(F::RETURNS),
                  always_returns: child.has(F::ALWAYS_RETURNS),
               };
            }

            if no_flow_impact {
               return self.no_flow_impact();
            }

            debug_assert!(block.exists, "Try block must always exist.");
            debug_assert!(
               catch.exists || finally.exists,
               "Try block must be accompanied by a catch or finally block."
            );

            debug!(
               "Analyzing a try{}{} statement.",
               if catch.exists { "-catch" } else { "" },
               if finally.exists { "-finally" } else { "" },
            );

            if block.returns {
               self.add(F::RETURNS);
            }

            if block.returns || catch.returns || finally.returns {
               debug!("Found a return within the try statement.");

               let only_finally_returns =
                  finally.returns && !(block.returns || catch.returns);

               if only_finally_returns {
                  // The only return is within the finally block, it must always
                  // return to avoid falling through. The try/catch block
                  // doesn't need to return since this will always take
                  // precedence.

                  debug!("The only return is within the finally block.");

                  if !finally.always_returns {
                     debug!(
                        "However, it doesn't always return. Falling through."
                     );
                     return self.falls_through();
                  }
               } else {
                  // A return is present in any of the branches which requires
                  // that the try/catch branches both always return if the
                  // finally block doesn't.
                  if !finally.always_returns &&
                     ((!block.always_returns && block.exists) ||
                        (!catch.always_returns && catch.exists))
                  {
                     debug!(
                        "All try branches do not always return. Falling \
                         through."
                     );
                     return self.falls_through();
                  }
               }
            } else {
               debug!("No return found within the try statement.");
            }

            if finally.exists {
               if finally.throws {
                  self.add(F::THROWS);
               }
               if finally.returns {
                  self.add(F::RETURNS);
               }
               if finally.always_returns {
                  return self.add(F::ALWAYS_RETURNS);
               }
            }

            if catch.exists {
               if catch.throws && !finally.always_returns {
                  self.add(F::THROWS);
               }
               if catch.returns {
                  self.add(F::RETURNS);
               }
               if catch.always_returns && block.always_returns {
                  return self.add(F::ALWAYS_RETURNS);
               }
            } else {
               // Without a catch block we assume that the try block may throw
               // even without an explicit throw. If there is a finally block,
               // it will not handle the throw since if it did, we would have
               // returned above.
               self.add(F::THROWS);
            }
         }
         StmtType::TryBlock => {
            self.compute_block();
         }
         StmtType::TryCatch => {
            self.compute_block();
         }
         StmtType::TryFinally => {
            self.compute_block();
         }

         // Jumps.
         StmtType::Break => {
            self.add(F::BREAKS);
         }
         StmtType::Continue => {
            self.add(F::CONTINUES);
         }
         StmtType::Throw => {
            self.add(F::THROWS | F::ALWAYS_RETURNS);
         }
         StmtType::Return => {
            self.add(F::RETURNS | F::ALWAYS_RETURNS);
         }
      };
   }

   fn compute_block(&mut self) {
      remove_unneeded_children(&mut self.children);
      let flags = Self::compute_block_like_stmts(&self.children);
      self.flags.add_from(&flags, None);
   }

   // TODO: throw statements should count as a return.
   // Maybe add ALWAYS_THROWS.
   fn compute_block_like_stmts(stmts: &Vec<StmtCtx>) -> Flags {
      let mut flags = F::default();

      if stmts.is_empty() {
         flags.add(F::NO_FLOW_IMPACT);
         return flags;
      }

      if stmts.len() == 1 {
         let stmt = &stmts[0];

         // Cannot perform this skip with if statements since we need to check
         // both branches.
         if stmt.kind != StmtType::If {
            flags.add_from(&stmt.flags, None);
            return flags;
         }
      }

      // Copy the relevant flags from the statements inside the block.
      for child in stmts {
         flags.add_from(
            &child.flags,
            Some(F::HAS_RETURN_LIKE | F::FALLS_THROUGH),
         );
      }

      if flags.has(F::FALLS_THROUGH) {
         // A statement in the block can potentially fall through. We do not
         // need to further analyze the block.
         return flags;
      }

      // TODO: we need to check for a return, otherwise a throw/continue/break
      // may not actually cause the block to fall through.

      if !flags.has_any(F::HAS_RETURN_LIKE) {
         flags.add(F::NO_FLOW_IMPACT);
         return flags;
      }

      if !flags.has(F::RETURNS) {
         // No return statement in the block, but there is a
         // break/continue/throw, so we must later consider this block
         // in the context of a parent statement.
         return flags;
      }

      /*
      We now know that the block contains a return statement and none of the
      statements fall through. For this block to always return (not fall through),
      the last statement must always return.

      Examples of current possibilities:
      ```ts
      // Ends with a statement that always returns:
      {
         let x = 0;
         return x;
      }
      {
         if (cond) { return 1; }
         else { return 2; }
      }
      // Does not end with a statement that always returns:
      {
         let x = 0;
         if (cond) { return x; } // [#1] see note below.
      }
      {
         if (cond) { return 1; }
         doSomething();
      }
      ```
      Notes:
      [#1] This last statement is considered to always return and not fall through. This is because
           the block will always return when it is entered. Therefore, we must perform an extra check
           for if statements to ensure it also contains an else branch that always returns.
           The reason for this is to allow for the following:
           ```ts
           if (cond) { return 1; }
           return 2;
           ```
      */

      // A block that contains stmts that return and do not fall through,
      // must always finish with a return.
      let final_stmt = stmts.last().expect("No final statement.");

      if Self::block_falls_through(final_stmt) {
         flags.add(F::FALLS_THROUGH);
      } else {
         flags.add(F::ALWAYS_RETURNS);
      }
      return flags;
   }

   fn block_falls_through(final_stmt: &StmtCtx) -> bool {
      if final_stmt.has(F::FALLS_THROUGH) || !final_stmt.has(F::ALWAYS_RETURNS)
      {
         // The statement does not always return.
         // Therefore, the block can fall through.
         return true;
      }
      if final_stmt.kind == StmtType::If && final_stmt.else_stmts.is_none() {
         // It is an if statement that always returns. However, it does not
         // contain an else branch.
         // Therefore, in the context of this block, if the condition is not met
         // it will fall through.
         return true;
      }
      return false;
   }

   fn falls_through(&mut self) {
      self.add(F::FALLS_THROUGH);
      self.rem(F::ALWAYS_RETURNS);
   }

   fn no_flow_impact(&mut self) {
      self.add(F::NO_FLOW_IMPACT);
      self.rem(F::ALWAYS_RETURNS);
   }
}

impl StmtCtx {
   /// Checks if ANY of the children have ALL of the given flags.
   #[inline]
   fn child_has(&self, flags: Flags) -> bool {
      return self.children.iter().any(|c| return c.has(flags));
   }

   /// Checks if ANY of the children have ANY of the given flags.
   #[inline]
   fn child_has_any(&self, flags: Flags) -> bool {
      return self.children.iter().any(|c| return c.has_any(flags));
   }

   /// Checks if ALL of the children have ALL of the given flags.
   #[inline]
   fn children_have(&self, flags: Flags) -> bool {
      return self.children.iter().all(|c| return c.has(flags));
   }

   /// Checks if ALL of the children have ANY of the given flags.
   #[inline]
   fn _children_have_any(&self, flags: Flags) -> bool {
      return self.children.iter().all(|c| return c.has_any(flags));
   }

   /// Copies all the set flags from the children.
   #[inline]
   fn _add_from_children(&mut self, flags: Option<Flags>) {
      return self
         .children
         .iter()
         .for_each(|c| self.flags.add_from(&c.flags, flags));
   }
}

/// Remove children that are unnecessary for analysis.
fn remove_unneeded_children(children: &mut Vec<StmtCtx>) {
   children.retain(|child| return !child.has(F::NO_FLOW_IMPACT));
}

impl Debug for StmtCtx {
   fn fmt(&self, f: &mut core::fmt::Formatter) -> core::fmt::Result {
      let StmtCtx {
         kind,
         flags,
         children,
         label,
         then_stmts,
         else_stmts,
      } = self;

      let mut s = f.debug_struct("StmtCtx");

      s.field("kind", &kind)
         .field("flags", &flags)
         .field("children", &children);

      if let Some(l) = label {
         s.field("label", &l);
      }
      if let Some(t) = then_stmts {
         s.field("then_stmts", &t);
      }
      if let Some(e) = else_stmts {
         s.field("else_stmts", &e);
      }
      return s.finish();
   }
}

mod stmt_flags {
   use super::*;

   bitflags! {
      #[derive(Debug, Default, Copy, Clone, PartialEq, Eq, PartialOrd, Ord)]
      pub struct Flags: u32 {
         /// The statement does not effect the control flow of a `lz.block()` call.
         const NO_FLOW_IMPACT = 1 << 0;
         /// There is a return statement somewhere in the statement.
         const RETURNS = 1 << 1;
         /// There is a break statement somewhere in the statement.
         const BREAKS = 1 << 2;
         /// There is a continue statement somewhere in the statement.
         const CONTINUES = 1 << 3;
         /// There is a throw statement somewhere in the statement.
         const THROWS = 1 << 4;
         /// The statement will always encounter a `return` when it is entered.
         /// ```ts
         /// // The use of `#` is to indicate where a block starts and ends.
         /// { // #1
         ///    if (cond) { // #2
         ///      return val;
         ///    } // #2 `always_returns` = true
         /// } // #1 `always_returns` = false
         ///
         /// { // #1
         ///    if (cond) { // #2
         ///      return val;
         ///    } // #2 `always_returns` = true
         ///    return other;
         /// } // #1 `always_returns` = true
         ///
         /// { // #1
         ///    if (cond) { // #2
         ///      return val;
         ///    } // #2 `always_returns` = true
         ///    else { // #3
         ///      return other;
         ///    } // #3 `always_returns` = true
         /// } // #1 `always_returns` = true
         /// ```
         const ALWAYS_RETURNS = 1 << 5;
         /// There is a return within the statement, but not all code paths end with
         /// one. Hence there's a possibility that the statement will fall through.
         const FALLS_THROUGH = 1 << 6;


         const HAS_RETURN_LIKE = Self::RETURNS.bits() | Self::BREAKS.bits() | Self::CONTINUES.bits() | Self::THROWS.bits();
      }
   }

   #[allow(clippy::trivially_copy_pass_by_ref)]
   impl Flags {
      /// Add all the set flags from another instance.
      #[inline]
      pub fn add_from(&mut self, other: &Flags, mask: Option<Flags>) {
         if let Some(m) = mask {
            *self |= other.intersection(m);
         } else {
            *self |= *other;
         }
      }

      /// The bitwise or (`|`) of the bits in two flags values.
      #[inline]
      pub fn add(&mut self, other: Flags) {
         self.insert(other);
      }

      /// The intersection of a source flags value with the complement of a
      /// target flags value (`&!`).
      ///
      /// This method is not equivalent to `self & !other` when `other` has
      /// unknown bits set. `remove` won't truncate `other`, but the `!`
      /// operator will.
      #[inline]
      pub fn rem(&mut self, other: Flags) {
         self.remove(other);
      }

      /// Whether all set bits in a source flags value are also set in a target
      /// flags value.
      #[inline]
      pub fn has(&self, other: Flags) -> bool {
         return self.contains(other);
      }

      /// Whether any set bits in a source flags value are also set in a target
      /// flags value.
      #[inline]
      pub fn has_any(&self, other: Flags) -> bool {
         return self.intersects(other);
      }
   }

   #[cfg(test)]
   mod stmt_flags_test {
      use super::*;

      #[test]
      fn a() {
         let mut f = F::default();
         f.add(F::RETURNS);
         assert!(f.has(F::RETURNS));
      }

      #[test]
      fn b() {
         let mut f = F::default();
         f.add(F::RETURNS);
         f.rem(F::THROWS);
         assert!(f.has(F::RETURNS));
         assert!(!f.has(F::THROWS));
      }

      #[test]
      fn c() {
         let mut f = F::default();
         f.add(F::HAS_RETURN_LIKE);
         assert!(f.has(F::RETURNS));
         assert!(f.has(F::BREAKS));
         assert!(f.has(F::CONTINUES));
         assert!(f.has(F::THROWS));
         assert!(f.has(F::HAS_RETURN_LIKE));
         assert!(f.has(F::RETURNS | F::BREAKS | F::CONTINUES | F::THROWS));
      }

      #[test]
      fn d() {
         let mut f = F::default();
         f.add(F::RETURNS);
         assert!(f.has(F::RETURNS));
         assert!(!f.has(F::HAS_RETURN_LIKE));
         assert!(f.has_any(F::HAS_RETURN_LIKE));
      }

      #[test]
      fn e() {
         let mut f = F::default();
         let mut g = F::default();
         g.add(F::FALLS_THROUGH | F::RETURNS);
         f.add_from(&g, Some(F::FALLS_THROUGH));
         assert!(g.has(F::FALLS_THROUGH | F::RETURNS));
         assert!(f.has(F::FALLS_THROUGH));
         assert!(!f.has(F::RETURNS));
      }
   }
}

pub use stmt_flags::Flags;

// use bitflags::bitflags;
// use core::fmt::Debug;
// use swc_ecma_ast::Ident;
// use tracing::debug;

// use super::*;

// bitflags! {
//    #[derive(Debug, Default, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
//    pub struct Flags: u32 {
//       /// The statement does not effect the control flow of a `lz.block()`
// call.       const NO_FLOW_IMPACT = 1 << 0;
//       /// There is a return statement somewhere in the statement.
//       const RETURNS = 1 << 1;
//       /// There is a break statement somewhere in the statement.
//       const BREAKS = 1 << 2;
//       /// There is a continue statement somewhere in the statement.
//       const CONTINUES = 1 << 3;
//       /// There is a throw statement somewhere in the statement.
//       const THROWS = 1 << 4;
//       /// The statement will always encounter a `return` when it is entered.
//       /// ```ts
//       /// // The use of `#` is to indicate where a block starts and ends.
//       /// { // #1
//       ///    if (cond) { // #2
//       ///      return val;
//       ///    } // #2 `always_returns` = true
//       /// } // #1 `always_returns` = false
//       ///
//       /// { // #1
//       ///    if (cond) { // #2
//       ///      return val;
//       ///    } // #2 `always_returns` = true
//       ///    return other;
//       /// } // #1 `always_returns` = true
//       ///
//       /// { // #1
//       ///    if (cond) { // #2
//       ///      return val;
//       ///    } // #2 `always_returns` = true
//       ///    else { // #3
//       ///      return other;
//       ///    } // #3 `always_returns` = true
//       /// } // #1 `always_returns` = true
//       /// ```
//       const ALWAYS_RETURNS = 1 << 5;
//       const FALLS_THROUGH = 1 << 6;
//       const INSIDE_TRY = 1 << 7;
//       const HAS_TRY = 1 << 8;
//       const HAS_CATCH = 1 << 9;
//       const HAS_FINALLY = 1 << 10;

//       const HAS_RETURN_LIKE = Self::RETURNS.bits() | Self::BREAKS.bits() |
// Self::CONTINUES.bits() | Self::THROWS.bits();    }
// }
// use self::Flags as F;

// #[derive(Clone, Copy, Debug, Default, PartialEq)]
// pub enum StmtType {
//    #[default]
//    Unknown,
//    /// The block statement of the function passed to `lz.block`.
//    /// ```ts
//    /// let val = lz.block(() => /* block start */ {
//    ///   // ...statements
//    /// } /* block end */ );
//    /// TopLevel is the same as Block, except that it is the top level block.
//    TopLevel,
//    Block,
//    Labeled,

//    If,
//    Return,
//    Break,
//    Continue,
//    Throw,

//    For,
//    ForIn,
//    ForOf,

//    While,
//    DoWhile,

//    Switch,
//    SwitchCase,
//    SwitchDefault,

//    Try,
//    TryBlock,
//    TryCatch,
//    TryFinally,
// }

// /// The context of a statement.
// /// Consider the following code:
// /// ```ts
// /// // `ends_with_return` is TRUE for this block.
// /// {
// ///   return 1;
// /// }
// ///
// /// // However, placed in the context of another block
// /// // inside an `If`, `ends_with_return` is now FALSE.
// /// {
// ///   if (cond) {
// ///     return 1;
// ///   }
// /// }
// /// ```
// #[derive(Clone, Default)]
// pub struct StmtCtx {
//    pub kind: StmtType,
//    pub flags: Flags,

//    /// A list of all the child statements within this statement.
//    pub children: Vec<StmtCtx>,

//    /// The label of a labeled statement that this statement is a child of.
//    pub label: Option<Ident>,

//    /// Only used for kind `StmtType::If`.
//    pub then_stmts: Option<Vec<StmtCtx>>,
//    /// Only used for kind `StmtType::If`.
//    pub else_stmts: Option<Vec<StmtCtx>>,
// }

// impl StmtCtx {
//    pub fn add(&mut self, flag: Flags) {
//       self.flags.insert(flag);
//    }

//    #[allow(clippy::trivially_copy_pass_by_ref)]
//    pub fn add_from(&mut self, other: &Flags, mask: Option<Flags>) {
//       self.flags.add_from(other, mask);
//    }

//    pub fn rem(&mut self, flag: Flags) {
//       self.flags.remove(flag);
//    }

//    pub fn has(&self, flag: Flags) -> bool {
//       return self.flags.contains(flag);
//    }

//    pub fn has_any(&self, flag: Flags) -> bool {
//       return self.flags.has_any(flag);
//    }

//    pub fn compute(&mut self) {
//       // Fast path may have already computed the effect of this statement.
//       bail_if!(self.has(F::NO_FLOW_IMPACT) || self.has(F::FALLS_THROUGH));

//       if self.child_has(F::FALLS_THROUGH) {
//          return self.falls_through();
//       }

//       match self.kind {
//          StmtType::TopLevel => {
//             debug_assert!(!self.children.is_empty());

//             self.compute_block();

//             // Top level block must always return.
//             if !self.has(F::ALWAYS_RETURNS) {
//                self.falls_through();
//             }
//          }
//          StmtType::Block => {
//             self.compute_block();
//          }

//          StmtType::If => {
//             // If statement children are stored in `(then|else)_stmts`.
//             debug_assert!(self.children.is_empty());

//             let then_stmts = self
//                .then_stmts
//                .as_mut()
//                .expect("If Statement is missing a then branch.");
//             remove_unneeded_children(then_stmts);

//             let then_flags = Self::compute_block_like_stmts(then_stmts);
//             let (else_flags, else_exists) =
//                if let Some(else_stmts) = self.else_stmts.as_mut() {
//                   remove_unneeded_children(else_stmts);
//                   (Self::compute_block_like_stmts(else_stmts), true)
//                } else {
//                   (F::default(), false)
//                };

//             // Copy the flags from each branch.
//             self.add_from(&then_flags.union(else_flags), None);

//             if !self.has_any(F::HAS_RETURN_LIKE) {
//                return self.no_flow_impact();
//             }

//             if self.has(F::FALLS_THROUGH) {
//                return self.falls_through();
//             }

//             if else_exists {
//                // Both branches exist. Both must always return otherwise the
// if                // statement can fall through.
//                if !then_flags.has(F::ALWAYS_RETURNS) ||
//                   !else_flags.has(F::ALWAYS_RETURNS)
//                {
//                   return self.falls_through();
//                }
//             }
//          }

//          StmtType::For |
//          StmtType::ForIn |
//          StmtType::ForOf |
//          StmtType::While |
//          StmtType::DoWhile => {
//             // TODO(feat=labels): This will need to be updated to handle
// labels.

//             remove_unneeded_children(&mut self.children);

//             if self.children.is_empty() {
//                return self.no_flow_impact();
//             }

//             self.compute_block();

//             let child_returns = self.child_has(F::RETURNS);

//             if child_returns && self.child_has_any(F::BREAKS | F::CONTINUES)
// {                // A break/continue in the presence of a return means the
// loop                // can fall through.
//                return self.falls_through();
//             }

//             if self.child_has(F::RETURNS) {
//                // If any of the children break or continue, then the loop can
//                // fall through.
//                return self.falls_through();
//             }

//             // The loop will consume these flags.
//             self.rem(F::BREAKS | F::CONTINUES);
//          }

//          StmtType::Switch => {
//             let mut has_default = false;
//             let mut no_flow_impact = true;

//             for child in &self.children {
//                has_default |= child.kind == StmtType::SwitchDefault;
//                no_flow_impact &= child.has(F::NO_FLOW_IMPACT);

//                // A break will be consumed by this switch statement,
// therefore                // we don't need to copy it.
//                self.flags.add_from(
//                   &child.flags,
//                   Some(F::CONTINUES | F::RETURNS | F::THROWS),
//                );
//             }

//             if no_flow_impact {
//                return self.no_flow_impact();
//             }

//             let has_return = self.has(F::RETURNS);

//             if has_return {
//                // A break/continue in the presence of a return means the
// switch                // can fall through.
//                if self.has_any(F::CONTINUES | F::BREAKS) {
//                   return self.falls_through();
//                }

//                // If any of the children return, they all must always return.
// No                // default case is considered missing a return.
//                if !has_default || !self.children_have(F::ALWAYS_RETURNS) {
//                   return self.falls_through();
//                }

//                return self.add(F::ALWAYS_RETURNS);
//             }
//          }
//          StmtType::SwitchCase => {
//             bail_if!(self.children.is_empty());
//             self.compute_block();
//          }
//          StmtType::SwitchDefault => {
//             bail_if!(self.children.is_empty());
//             self.compute_block();
//          }

//          StmtType::Try => {
//             // TODO: This section can be simplified.

//             let mut no_flow_impact = true;

//             for child in &self.children {
//                self
//                   .flags
//                   .add_from(&child.flags, Some(F::BREAKS | F::CONTINUES));

//                no_flow_impact &= child.has(F::NO_FLOW_IMPACT);
//             }

//             if no_flow_impact {
//                return self.no_flow_impact();
//             }

//             let TryCtx {
//                block,
//                catch,
//                finally,
//             } = compute_try_catch(self);

//             if block.returns || catch.returns || finally.returns {
//                debug!("Found a return in a try statement.");
//                let only_finally_returns =
//                   finally.returns && !block.returns && !catch.returns;

//                if only_finally_returns {
//                   debug!("Only the finally block returns");
//                   // The only return is in the finally block and must always
//                   // return to avoid falling through. The try/catch block
//                   // doesn't need to return since this will always take
//                   // precedence.
//                   if !finally.always_returns {
//                      debug!(
//                         "Finally block does not always return. Falling \
//                          through."
//                      );

//                      return self.falls_through();
//                   }
//                } else {
//                   // A return is present in any of the branches which
// requires                   // that the try/catch branches both always return
// if the                   // finally block doesn't.
//                   if !finally.always_returns &&
//                      ((!block.always_returns && block.exists) ||
//                         (!catch.always_returns && catch.exists))
//                   {
//                      debug!(
//                         "All branches do not always return. Falling through."
//                      );
//                      return self.falls_through();
//                   }
//                }
//             } else {
//                // No return in any of the branches.
//             }

//             if finally.exists {
//                if finally.throws {
//                   self.add(F::THROWS);
//                }
//                if finally.returns {
//                   self.add(F::RETURNS);
//                }
//                if finally.always_returns {
//                   return self.add(F::ALWAYS_RETURNS);
//                }
//             } else {
//                debug!("No finally block in try statement.");
//             }

//             if catch.exists {
//                if catch.throws && !finally.always_returns {
//                   self.add(F::THROWS);
//                }
//                if catch.returns {
//                   self.add(F::RETURNS);
//                }
//                if catch.always_returns && block.always_returns {
//                   return self.add(F::ALWAYS_RETURNS);
//                }
//             } else {
//                debug!("No catch block in try statement.");
//                // Without a catch block we assume that the try block may
// throw                // even without an explicit throw. If there is a finally
// block,                // it will not handle the throw since if it did, we
// would have                // returned above.
//                self.add(F::THROWS);
//             }
//          }
//          StmtType::TryBlock => {
//             self.compute_block();
//          }
//          StmtType::TryCatch => {
//             self.compute_block();
//          }
//          StmtType::TryFinally => {
//             self.compute_block();
//          }

//          StmtType::Labeled => {
//             // TODO(feat=labels): Implement inlining `LabeledStmt`.
//             // Currently we should only get here if we encounter a labeled
//             // statement that have no flow impact.
//             if !self.has(F::NO_FLOW_IMPACT) {
//                todo!("Implement inlining `LabeledStmt`.");
//             }
//          }

//          StmtType::Return |
//          StmtType::Break |
//          StmtType::Continue |
//          StmtType::Throw => {
//             // All flags will be set by the visitor.
//             return;
//          }
//          StmtType::Unknown => unreachable!(
//             "Attempted to compute the context of an unknown statement type."
//          ),
//       };
//    }

//    fn compute_block(&mut self) {
//       remove_unneeded_children(&mut self.children);
//       let flags = Self::compute_block_like_stmts(&self.children);
//       self.flags.add_from(&flags, None);
//    }

//    // TODO: throw statements should count as a return.
//    // Maybe add ALWAYS_THROWS.
//    fn compute_block_like_stmts(stmts: &Vec<StmtCtx>) -> Flags {
//       let mut flags = F::default();

//       if stmts.is_empty() {
//          flags.add(F::NO_FLOW_IMPACT);
//          return flags;
//       }

//       if stmts.len() == 1 {
//          let stmt = &stmts[0];

//          // Cannot perform this skip with if statements since we need to
// check          // both branches.
//          if stmt.kind != StmtType::If {
//             flags.add_from(&stmt.flags, None);
//             return flags;
//          }
//       }

//       // Copy the relevant flags from the statements inside the block.
//       for child in stmts {
//          flags.add_from(
//             &child.flags,
//             Some(F::HAS_RETURN_LIKE | F::FALLS_THROUGH),
//          );
//       }

//       if flags.has(F::FALLS_THROUGH) {
//          // A statement in the block can potentially fall through. We do not
//          // need to further analyze the block.
//          return flags;
//       }

//       // TODO: we need to check for a return, otherwise a
// throw/continue/break       // may not actually cause the block to fall
// through.

//       if !flags.has_any(F::HAS_RETURN_LIKE) {
//          flags.add(F::NO_FLOW_IMPACT);
//          return flags;
//       }

//       if !flags.has(F::RETURNS) {
//          // No return statement in the block, but there is a
//          // break/continue/throw, so we must later consider this block
//          // in the context of a parent statement.
//          return flags;
//       }

//       /*
//       We now know that the block contains a return statement and none of the
//       statements fall through. For this block to always return (not fall
// through),       the last statement must always return.

//       Examples of current possibilities:
//       ```ts
//       // Ends with a statement that always returns:
//       {
//          let x = 0;
//          return x;
//       }
//       {
//          if (cond) { return 1; }
//          else { return 2; }
//       }
//       // Does not end with a statement that always returns:
//       {
//          let x = 0;
//          if (cond) { return x; } // [#1] see note below.
//       }
//       {
//          if (cond) { return 1; }
//          doSomething();
//       }
//       ```
//       Notes:
//       [#1] This last statement is considered to always return and not fall
// through. This is because            the block will always return when it is
// entered. Therefore, we must perform an extra check            for if
// statements to ensure it also contains an else branch that always returns.
//            The reason for this is to allow for the following:
//            ```ts
//            if (cond) { return 1; }
//            return 2;
//            ```
//       */
//       // A block that contains stmts that return and do not fall through,
//       // must always finish with a return.
//       let final_stmt = stmts.last().expect("No final statement.");

//       if Self::block_falls_through(final_stmt) {
//          flags.add(F::FALLS_THROUGH);
//       } else {
//          flags.add(F::ALWAYS_RETURNS);
//       }
//       return flags;
//    }

//    fn block_falls_through(final_stmt: &StmtCtx) -> bool {
//       if !final_stmt.has(F::ALWAYS_RETURNS) {
//          // The statement does not always return.
//          // Therefore, the block can fall through.
//          return true;
//       }
//       if final_stmt.kind == StmtType::If && final_stmt.else_stmts.is_none() {
//          // It is an if statement that always returns. However, it does not
//          // contain an else branch.
//          // Therefore, in the context of this block, if the condition is not
// met          // it will fall through.
//          return true;
//       }
//       return false;
//    }

//    fn falls_through(&mut self) {
//       self.add(F::FALLS_THROUGH);
//       self.rem(F::ALWAYS_RETURNS);
//    }

//    fn no_flow_impact(&mut self) {
//       self.add(F::NO_FLOW_IMPACT);
//       self.rem(F::ALWAYS_RETURNS);
//    }
// }

// impl StmtCtx {
//    /// Checks if ANY of the children have ALL of the given flags.
//    #[inline]
//    fn child_has(&self, flags: Flags) -> bool {
//       return self.children.iter().any(|c| return c.has(flags));
//    }

//    /// Checks if ANY of the children have ANY of the given flags.
//    #[inline]
//    fn child_has_any(&self, flags: Flags) -> bool {
//       return self.children.iter().any(|c| return c.has_any(flags));
//    }

//    /// Checks if ALL of the children have ALL of the given flags.
//    #[inline]
//    fn children_have(&self, flags: Flags) -> bool {
//       return self.children.iter().all(|c| return c.has(flags));
//    }

//    /// Checks if ALL of the children have ANY of the given flags.
//    #[inline]
//    fn _children_have_any(&self, flags: Flags) -> bool {
//       return self.children.iter().all(|c| return c.has_any(flags));
//    }

//    /// Copies all the set flags from the children.
//    #[inline]
//    fn _add_from_children(&mut self, flags: Option<Flags>) {
//       return self
//          .children
//          .iter()
//          .for_each(|c| self.flags.add_from(&c.flags, flags));
//    }
// }

// /// Remove children that are unnecessary for analysis.
// fn remove_unneeded_children(children: &mut Vec<StmtCtx>) {
//    children.retain(|child| return !child.has(F::NO_FLOW_IMPACT));
// }

// #[allow(clippy::trivially_copy_pass_by_ref)]
// impl Flags {
//    /// Add all the set flags from another instance.
//    #[inline]
//    pub fn add_from(&mut self, other: &Flags, mask: Option<Flags>) {
//       if let Some(m) = mask {
//          *self |= other.intersection(m);
//       } else {
//          *self |= *other;
//       }
//    }

//    /// The bitwise or (`|`) of the bits in two flags values.
//    #[inline]
//    pub fn add(&mut self, other: Flags) {
//       self.insert(other);
//    }

//    /// The intersection of a source flags value with the complement of a
// target    /// flags value (`&!`).
//    ///
//    /// This method is not equivalent to `self & !other` when `other` has
// unknown    /// bits set. `remove` won't truncate `other`, but the `!`
// operator will.    #[inline]
//    pub fn rem(&mut self, other: Flags) {
//       self.remove(other);
//    }

//    /// Whether all set bits in a source flags value are also set in a target
//    /// flags value.
//    #[inline]
//    pub fn has(&self, other: Flags) -> bool {
//       return self.contains(other);
//    }

//    /// Whether any set bits in a source flags value are also set in a target
//    /// flags value.
//    #[inline]
//    pub fn has_any(&self, other: Flags) -> bool {
//       return self.intersects(other);
//    }
// }

// #[cfg(test)]
// mod tests {
//    use super::*;

//    #[test]
//    fn a() {
//       let mut f = F::default();
//       f.add(F::RETURNS);
//       assert!(f.has(F::RETURNS));
//    }

//    #[test]
//    fn b() {
//       let mut f = F::default();
//       f.add(F::RETURNS);
//       f.rem(F::THROWS);
//       assert!(f.has(F::RETURNS));
//       assert!(!f.has(F::THROWS));
//    }

//    #[test]
//    fn c() {
//       let mut f = F::default();
//       f.add(F::HAS_FINALLY | F::HAS_CATCH | F::THROWS);
//       f.rem(F::THROWS);
//       assert!(f.has(F::HAS_FINALLY | F::HAS_CATCH));
//       assert!(!f.has(F::THROWS));
//    }

//    #[test]
//    fn d() {
//       let mut f = F::default();
//       let mut g = F::default();
//       g.add(F::FALLS_THROUGH | F::RETURNS);
//       f.add_from(&g, Some(F::FALLS_THROUGH));
//       assert!(g.has(F::FALLS_THROUGH | F::RETURNS));
//       assert!(f.has(F::FALLS_THROUGH));
//       assert!(!f.has(F::RETURNS));
//    }

//    #[test]
//    fn e() {
//       let mut f = F::default();
//       f.set(F::HAS_RETURN_LIKE, true);
//       assert!(f.has(F::RETURNS));
//       assert!(f.has(F::BREAKS));
//       assert!(f.has(F::CONTINUES));
//       assert!(f.has(F::THROWS));
//       assert!(f.has(F::HAS_RETURN_LIKE));
//       assert!(f.has(F::RETURNS | F::BREAKS | F::CONTINUES | F::THROWS));
//    }

//    #[test]
//    fn f() {
//       let mut f = F::default();
//       f.set(F::RETURNS, true);
//       assert!(f.has(F::RETURNS));
//       assert!(!f.has(F::HAS_RETURN_LIKE));
//       assert!(f.has_any(F::HAS_RETURN_LIKE));
//    }
// }

// #[derive(Debug, Default)]
// struct TryCtx {
//    pub block: TryBranchCtx,
//    pub catch: TryBranchCtx,
//    pub finally: TryBranchCtx,
// }

// #[derive(Debug, Default)]
// struct TryBranchCtx {
//    pub exists: bool,
//    pub throws: bool,
//    pub returns: bool,
//    pub always_returns: bool,
// }

// fn compute_try_catch(stmt: &StmtCtx) -> TryCtx {
//    fn branch_ctx(branch: &StmtCtx) -> TryBranchCtx {
//       return TryBranchCtx {
//          exists: true,
//          throws: branch.has(F::THROWS),
//          returns: branch.has(F::RETURNS),
//          always_returns: branch.has(F::ALWAYS_RETURNS),
//       };
//    }

//    let mut ctx = TryCtx::default();

//    for child in &stmt.children {
//       match child.kind {
//          StmtType::TryBlock => {
//             ctx.block = branch_ctx(child);
//          }
//          StmtType::TryCatch => {
//             ctx.catch = branch_ctx(child);
//          }
//          StmtType::TryFinally => {
//             ctx.finally = branch_ctx(child);
//          }
//          _ => unreachable!(
//             "Unknown child of try statement with kind: {:?}",
//             child.kind
//          ),
//       };
//    }

//    return ctx;
// }

// impl Debug for StmtCtx {
//    fn fmt(&self, f: &mut core::fmt::Formatter) -> core::fmt::Result {
//       let StmtCtx {
//          kind,
//          flags,
//          children,
//          label,
//          then_stmts,
//          else_stmts,
//       } = self;

//       let mut s = f.debug_struct("StmtCtx");

//       s.field("kind", &kind)
//          .field("flags", &flags)
//          .field("children", &children);

//       if let Some(l) = label {
//          s.field("label", &l);
//       }
//       if let Some(t) = then_stmts {
//          s.field("then_stmts", &t);
//       }
//       if let Some(e) = else_stmts {
//          s.field("else_stmts", &e);
//       }
//       return s.finish();
//    }
// }
