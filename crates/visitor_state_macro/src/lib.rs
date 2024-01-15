#![deny(
   clippy::all,
   clippy::implicit_return,
   clippy::unneeded_field_pattern,
   clippy::if_then_some_else_none,
   clippy::unseparated_literal_suffix
)]
#![allow(clippy::needless_return)]

use proc_macro::TokenStream;
use quote::{format_ident, quote};
use syn::{parse2, parse_macro_input, Ident, ImplItem, Stmt};

// TODO: document this macro
#[proc_macro_attribute]
pub fn save_state(args: TokenStream, input: TokenStream) -> TokenStream {
   let mut fields: Vec<Ident> = Vec::new();

   let parser = syn::meta::parser(|meta| {
      if let Some(ident) = meta.path.get_ident() {
         fields.push(ident.clone());
         return Ok(());
      } else {
         return Err(meta.error("unsupported syntax"));
      }
   });
   parse_macro_input!(args with parser);

   let mut parsed_input = parse_macro_input!(input as ImplItem);

   let method = match &mut parsed_input {
      ImplItem::Fn(method) => method,
      _ => panic!(
         "The `#[save_state()]` attribute can only be applied to struct \
          methods."
      ),
   };

   fn prev_ident(field: &Ident) -> Ident {
      return format_ident!("prev_{}", field);
   }

   // Generate code to save state.
   let stmts = fields.iter().map(|field| {
      let prev_field = prev_ident(field);

      return parse2::<Stmt>(quote! {
         let #prev_field = self.#field;
      })
      .unwrap();
   });
   method.block.stmts.splice(0..0, stmts);

   // Generate code to restore state.
   let mut stmts: Vec<Stmt> = fields
      .iter()
      .rev()
      .map(|field| {
         let prev_field = prev_ident(field);

         return parse2::<Stmt>(quote! {
            self.#field = #prev_field;
         })
         .unwrap();
      })
      .collect();

   method.block.stmts.append(&mut stmts);

   return TokenStream::from(quote! { #parsed_input });
}
