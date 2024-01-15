use lazy_static::lazy_static;
use swc_atoms::JsWord;

pub const PKG_NAME: &str = "lazy-init";

lazy_static! {
   pub static ref PKG_NAME_JSWORD: JsWord = PKG_NAME.into();
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LzMethodKind {
   // -- Block --
   /// `lz.block()`
   Block,

   // -- Hoist --
   /// `lz()`
   Obj,
   /// `lz.async()`
   Async,
   /// `lz.fn()`
   Fn,
}

#[derive(Debug, Clone)]
pub struct LzMethod {
   pub sym: JsWord,
   pub kind: LzMethodKind,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ExportedFnName {
   Default,
   Block,
   Lz,
   Lzc,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ExportedFnKind {
   Block,
   Hoist,
}

impl From<ExportedFnKind> for LzMethodKind {
   fn from(kind: ExportedFnKind) -> Self {
      return match kind {
         ExportedFnKind::Block => LzMethodKind::Block,
         ExportedFnKind::Hoist => LzMethodKind::Obj,
      };
   }
}

#[derive(Debug)]
pub struct ExportedFn {
   pub kind: ExportedFnKind,
   pub methods: Option<Vec<LzMethod>>,
}

pub fn to_exported_fn(is_default: bool, name: &JsWord) -> Option<ExportedFn> {
   fn exported_fn_block() -> ExportedFn {
      return ExportedFn {
         kind: ExportedFnKind::Block,
         methods: None,
      };
   }

   fn exported_fn_lz() -> ExportedFn {
      return ExportedFn {
         kind: ExportedFnKind::Hoist,
         methods: Some(vec![
            LzMethod {
               sym: "block".into(),
               kind: LzMethodKind::Block,
            },
            LzMethod {
               sym: "fn".into(),
               kind: LzMethodKind::Fn,
            },
            LzMethod {
               sym: "async".into(),
               kind: LzMethodKind::Async,
            },
         ]),
      };
   }

   if is_default {
      return Some(exported_fn_lz());
   }
   return match &**name {
      "lz" | "lzc" => Some(exported_fn_lz()),
      "block" => Some(exported_fn_block()),
      _ => None,
   };
}
