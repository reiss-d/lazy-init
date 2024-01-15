mod split_test;

use std::{
   fs::read_to_string,
   path::{Path, PathBuf},
};
use swc_common::{chain, Mark, Span, Spanned};
use swc_ecma_ast::*;
use swc_ecma_parser::{Syntax, TsConfig};
use swc_ecma_transforms_base::resolver;
use swc_ecma_transforms_testing::{test_fixture, FixtureTestConfig, Tester};
use swc_ecma_visit::as_folder;
use testing::fixture;

use super::*;
use split_test::split_test_fixture;

#[allow(clippy::needless_pass_by_value)]
#[fixture("src/tests/fixture/lazy_visitor/methods/block/**/*.ts")]
fn lazy_block_test(input: PathBuf) {
   use crate::{configs::PluginConfig, visitor};

   split_test_fixture(
      ts_syntax(),
      &|_tr, is_compressed| {
         let unresolved_mark = Mark::new();
         let top_level_mark = Mark::new();

         return chain!(
            resolver(unresolved_mark, top_level_mark, false),
            as_folder(visitor::LazyVisitor::new(
               PluginConfig {
                  compress_blocks: is_compressed,
                  ..PluginConfig::default()
               },
               visitor::ProgramMetadata {
                  unresolved_mark,
               },
            ))
         );
      },
      &input,
   );
}

#[allow(clippy::needless_pass_by_value)]
#[fixture(
   "src/tests/fixture/lazy_visitor/methods/**/input.ts",
   exclude("src/tests/fixture/lazy_visitor/methods/block/**")
)]
// #[fixture("src/tests/fixture/lazy_visitor/**/output*.ts")]
fn lazy_hoist_test(input: PathBuf) {
   use crate::{configs::PluginConfig, visitor};

   let output = input
      .parent()
      .expect("Failed to find test fixture.")
      .join("output.ts");

   test_fixture(
      ts_syntax(),
      &|_tr| {
         let unresolved_mark = Mark::new();
         let top_level_mark = Mark::new();
         return chain!(
            resolver(unresolved_mark, top_level_mark, false),
            as_folder(visitor::LazyVisitor::new(
               PluginConfig {
                  compress_blocks: false,
                  ..PluginConfig::default()
               },
               visitor::ProgramMetadata {
                  unresolved_mark,
               },
            ))
         );
      },
      &input,
      &output,
      FixtureTestConfig::default(),
   );
}

#[fixture("src/tests/fixture/block_analyzer/*.ts")]
fn block_analyzer_test(input: PathBuf) {
   use crate::block::{analyze, TransformType};

   run_test(TestInput::File(input), |filepath, mut module| {
      let always_returns = filepath.contains("always_returns");

      for stmt in module.body.drain(..) {
         if let ModuleItem::Stmt(Stmt::Decl(Decl::Fn(mut decl))) = stmt {
            let body = unwrap_or!(decl.function.body.take(), continue);

            let mut block_stmt = Stmt::Block(body);
            let analyzed = analyze(&mut block_stmt);

            let (transform_type, final_ctx) = match analyzed {
               Ok(ok) => (ok.transform_type, ok.final_ctx),
               Err(err) => {
                  return Result::Err((err.msg, err.span));
               }
            };

            if always_returns {
               if transform_type != TransformType::Inline {
                  return Result::Err((
                     format!(
                        "Block does not always return! Result:\n{final_ctx:#?}"
                     ),
                     Some(block_stmt.span()),
                  ));
               }
               continue;
            }

            if transform_type != TransformType::Wrapped {
               return Result::Err((
                  format!(
                     "Block does not always fall through! \
                      Result:\n{final_ctx:#?}"
                  ),
                  Some(block_stmt.span()),
               ));
            };
         }
      }

      return Ok(());
   });
}

fn ts_syntax() -> Syntax {
   return Syntax::Typescript(TsConfig {
      tsx: false,
      ..Default::default()
   });
}

pub enum TestInput {
   /// Filepath.
   File(PathBuf),
   /// Filename and source code.
   ///
   /// E.g. `TestInput::Source("foo.js", "const foo = 1;")`
   Source(String, String),
}

impl TestInput {
   /// Returns the filepath and source code.
   pub fn get(self) -> (String, String) {
      match self {
         TestInput::File(path) => {
            return (
               get_fixture_path(path.as_path()),
               read_to_string(&path).expect("Failed to read test file."),
            )
         }
         TestInput::Source(name, src) => return (name, src),
      }
   }
}

pub fn run_test<F>(input: TestInput, op: F)
where
   F: FnOnce(String, Module) -> Result<(), (String, Option<Span>)>,
{
   Tester::run(|tester| {
      let (filepath, src) = input.get();
      let module = tester.apply_transform(
         resolver(Mark::new(), Mark::new(), false),
         &filepath,
         ts_syntax(),
         &src,
      )?;
      let result = op(filepath, module);

      match result {
         Ok(()) => {
            return Ok(());
         }
         Err((msg, span)) => {
            if let Some(span) = span {
               tester.handler.span_err(span, &msg);
            } else {
               tester.handler.err(&msg);
            }
            return Err(());
         }
      }
   });
}

fn get_fixture_path(input: &Path) -> String {
   let mut path_seg = input;
   let mut path = String::new();

   while !path_seg.ends_with("fixture") {
      if !path.is_empty() {
         path.insert(0, '/');
      }
      path.insert_str(
         0,
         path_seg.file_name().expect("").to_str().expect(""),
      );
      path_seg = path_seg.parent().expect("");
   }
   return path;
}
