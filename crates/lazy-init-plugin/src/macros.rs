#[macro_export]
macro_rules! unwrap_or {
   ($option:expr, $or:expr) => {
      if let Some(s) = $option {
         s
      } else {
         $or
      }
   };
   ($( $option:expr ),+ ; $or:expr) => {
      ($(
         if let Some(s) = $option {
            s
         } else {
            $or
         },
      )*)
   };
}

#[macro_export]
macro_rules! equals_or {
   ($a:expr, $b:expr, $or:expr) => {
      if ($a) != ($b) {
         $or
      }
   };
}

/// Returns if the condition is `true`.
#[macro_export]
macro_rules! bail_if {
   ($cond:expr) => {
      if ($cond) == true {
         return;
      }
   };
   ($cond:expr, $ret:expr) => {
      if ($cond) == true {
         return $ret;
      }
   };
}

#[macro_export]
macro_rules! prepend {
   ($into:expr, $out:expr) => {
      prepend!($into, $out, 0);
   };
   ($into:expr, $out:expr, $idx:expr) => {
      if !$out.is_empty() {
         $into.splice($idx..$idx, $out.drain(..));
      }
   };
}

#[macro_export]
macro_rules! error_msg {
   ($($arg:tt)*) => {
      $crate::utils::join_str("[lazy-init]: ", format!($($arg)*))
   };
}

// macro_rules! format {
//    ($($arg:tt)*) => {{
//        let res =
// $crate::fmt::format($crate::__export::format_args!($($arg)*));        res
//    }}
// }

#[macro_export]
macro_rules! swc_panic {
   ($span:expr, ($($arg:tt)*)) => {
      swc_common::errors::HANDLER
         .with(|handler| return handler.span_fatal($span, &error_msg!($($arg)*)))
         .raise()
   };
   ($($arg:tt)*) => {
      swc_common::errors::HANDLER
         .with(|handler| return handler.fatal(&error_msg!($($arg)*)))
         .raise()
   };
}

#[macro_export]
macro_rules! swc_assert {
   ($cond:expr, $($arg:tt)*) => {
      if !($cond) {
         swc_panic!($($arg)*);
      }
   };
}

#[macro_export]
macro_rules! swc_unwrap {
   ($option:expr, $($arg:tt)*) => {
      if let Some(s) = $option {
         s
      } else {
         swc_panic!($($arg)*)
      }
   };
}

/// Nodes that should not be visited inside the function passed to `lz.block()`.
#[macro_export]
macro_rules! noop_visit_block_ignored {
   () => {
      noop_visit_type!();
      noop_visit_block_ignored!(false);
   };
   (false) => {
      noop_visit_type!(visit_function, Function);
      noop_visit_type!(visit_fn_decl, FnDecl);
      noop_visit_type!(visit_fn_expr, FnExpr);
      noop_visit_type!(visit_arrow_expr, ArrowExpr);
      noop_visit_type!(visit_jsx_element, JSXElement);
      noop_visit_type!(visit_var_decl, VarDecl);
      noop_visit_type!(visit_call_expr, CallExpr);

      noop_visit_type!(visit_expr_stmt, ExprStmt);
   };
}

/// Nodes that should not be visited inside the function passed to `lz.block()`.
#[macro_export]
macro_rules! noop_visit_mut_block_ignored {
   () => {
      noop_visit_mut_type!();
      noop_visit_mut_block_ignored!(false);
   };
   (false) => {
      noop_visit_mut_type!(visit_mut_function, Function);
      noop_visit_mut_type!(visit_mut_fn_decl, FnDecl);
      noop_visit_mut_type!(visit_mut_fn_expr, FnExpr);
      noop_visit_mut_type!(visit_mut_arrow_expr, ArrowExpr);
      noop_visit_mut_type!(visit_mut_jsx_element, JSXElement);
      noop_visit_mut_type!(visit_mut_var_decl, VarDecl);
      noop_visit_mut_type!(visit_mut_call_expr, CallExpr);
   };
}

/// Creates an enum with variants matching the types passed.
/// Can be used to create a "union" like type.
#[macro_export]
macro_rules! union_enum {
   ($enum_name:ident, $( $variant:ident ),+) => {
      #[allow(clippy::enum_variant_names)]
      #[derive(Clone, Copy, Debug)]
      pub enum $enum_name<'a> {
         $(
            $variant(&'a $variant),
         )*
      }
      $(
         impl<'a> From<&'a $variant> for $enum_name<'a> {
            fn from(item: &'a $variant) -> Self {
               return $enum_name::$variant(item)
            }
         }
      )*
   };
   ($enum_name:ident, $( $variant:ident($variant_type:ty) ),+) => {
      #[allow(clippy::enum_variant_names)]
      #[derive(Clone, Copy, Debug)]
      pub enum $enum_name<'a> {
         $(
            $variant(&'a $variant_type),
         )*
      }
      $(
         impl<'a> From<&'a $variant_type> for $enum_name<'a> {
            fn from(item: &'a $variant_type) -> Self {
               return $enum_name::$variant(item)
            }
         }
      )*
      $(
         impl<'a> From<&'a mut $variant_type> for $enum_name<'a> {
            fn from(item: &'a mut $variant_type) -> Self {
               return $enum_name::$variant(&*item)
            }
         }
      )*
   };
}

// #[macro_export]
// macro_rules! ternary {
//     ($condition:expr; ?$expr_if_true:expr; :$expr_if_false:expr) => {
//         if $condition {
//             $expr_if_true
//         } else {
//             $expr_if_false
//         }
//     };
//     ($condition:expr; $($tt:tt)*) => {
//         ternary!(@parse $condition; (); $($tt)*)
//     };
//     (@parse $condition:expr; ($($expr_if_true:tt)*); ?$next:tt $($rest:tt)*)
// => {         ternary!(@parse $condition; ($($expr_if_true)* $next);
// $($rest)*)     };
//     (@parse $condition:expr; ($($expr_if_true:tt)*); :$next:tt $($rest:tt)*)
// => {         ternary!($condition; ?$($expr_if_true)*; :$next $($rest)*)
//     };
//     (@parse $condition:expr; ($($expr_if_true:tt)*); $($rest:tt)+) => {
//         ternary!(@parse $condition; ($($expr_if_true)*); $($rest)+)
//     };
// }
