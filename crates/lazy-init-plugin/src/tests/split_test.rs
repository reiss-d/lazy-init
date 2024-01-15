// This file contains modified code from the crate `swc_ecma_transforms_testing`
// Original Author: 강동윤
// Source: https://github.com/swc-project/swc/blob/5d944185187402691292fdb73ea767bd580e2a52/crates/swc_ecma_transforms_testing/src/lib.rs
// Licensed under the Apache License, Version 2.0

#![allow(clippy::unwrap_used, clippy::default_trait_access)]

use ansi_term::Color;
use std::{fs::read_to_string, path::Path, rc::Rc};
use swc_common::{comments::SingleThreadedComments, errors::HANDLER};
use swc_ecma_codegen::Emitter;
use swc_ecma_parser::Syntax;
use swc_ecma_transforms_base::{fixer, helpers::HELPERS, hygiene, pass::noop};
use swc_ecma_transforms_testing::{HygieneVisualizer, Tester};
use swc_ecma_visit::{Fold, FoldWith};
use testing::NormalizedOutput;

use super::*;

/// `tr`: Where `bool` indicates whether the output is compressed.
pub fn split_test_fixture<P>(
   syntax: Syntax,
   tr: &dyn Fn(&mut Tester, bool) -> P,
   input: &Path,
) where
   P: Fold,
{
   let _logger = testing::init();
   let test_content = read_to_string(input).unwrap_or_default();
   let TestContent {
      input,
      output,
      output_compressed: output_minified,
   } = format_test_content(&test_content);

   for out in [
      Some((output, false)),
      output_minified.map(|s| return (s, true)),
   ] {
      let (expected, is_compressed) = unwrap_or!(out, continue);

      let expected_src = Tester::run(|tester| {
         let expected_module = tester.apply_transform(
            noop(),
            if is_compressed {
               "expected.compressed.js"
            } else {
               "expected.js"
            },
            syntax,
            &expected,
         )?;

         let expected_src =
            tester.print(&expected_module, &tester.comments.clone());

         println!(
            "----- {} -----\n{}",
            Color::Green.paint("Expected"),
            expected_src
         );

         return Ok(expected_src);
      });

      let (actual_src, stderr) = run_captured(|tester| {
         println!(
            "----- {} -----\n{}",
            Color::Green.paint("Input"),
            &input
         );

         let tr = tr(tester, is_compressed);

         println!("----- {} -----", Color::Green.paint("Actual"));

         let actual = tester.apply_transform(tr, "input.js", syntax, &input)?;

         match ::std::env::var("PRINT_HYGIENE") {
            Ok(ref s) if s == "1" => {
               let hygiene_src = tester.print(
                  &actual.clone().fold_with(&mut HygieneVisualizer),
                  &tester.comments.clone(),
               );
               println!(
                  "----- {} -----\n{}",
                  Color::Green.paint("Hygiene"),
                  hygiene_src
               );
            }
            _ => {}
         }

         let actual = actual
            .fold_with(&mut hygiene::hygiene())
            .fold_with(&mut fixer::fixer(Some(&tester.comments)));

         let actual_src = {
            let module = &actual;
            let comments: &Rc<SingleThreadedComments> =
               &tester.comments.clone();
            let mut buf = vec![];
            {
               let mut emitter = Emitter {
                  cfg: Default::default(),
                  cm: tester.cm.clone(),
                  wr: Box::new(swc_ecma_codegen::text_writer::JsWriter::new(
                     tester.cm.clone(),
                     "\n",
                     &mut buf,
                     None,
                  )),
                  comments: Some(comments),
               };

               // println!("Emitting: {:?}", module);
               emitter.emit_module(module).unwrap();
            }

            let s = String::from_utf8_lossy(&buf);
            s.to_string()
         };

         return Ok(actual_src);
      });

      assert!(stderr.is_empty(), "stderr: {stderr}");

      if let Some(actual_src) = actual_src {
         println!("{actual_src}");

         if actual_src != expected_src {
            compare(
               NormalizedOutput::from(actual_src),
               expected_src,
               is_compressed,
            );
         }
      }
   }
}

fn run_captured<F, T>(op: F) -> (Option<T>, NormalizedOutput)
where
   F: FnOnce(&mut Tester<'_>) -> Result<T, ()>,
{
   let mut res = None;
   let output =
      testing::Tester::new().print_errors(|cm, handler| -> Result<(), _> {
         return HANDLER.set(&handler, || {
            return HELPERS.set(&Default::default(), || {
               let result = op(&mut Tester {
                  cm,
                  handler: &handler,
                  comments: Default::default(),
               });

               res = result.ok();

               // We need stderr
               return Err(());
            });
         });
      });

   let output = output
      .err()
      .unwrap_or_else(|| return NormalizedOutput::from(String::new()));

   return (res, output);
}

#[derive(Debug, Clone, Hash)]
struct Diff {
   pub actual: NormalizedOutput,
   /// Output stored in file.
   pub expected: NormalizedOutput,
}

fn compare(actual: NormalizedOutput, expected: String, is_compressed: bool) {
   let expected: NormalizedOutput = NormalizedOutput::new_raw(expected);

   if expected == actual {
      return;
   }

   println!(
      "Comparing with {}output:",
      if is_compressed { "compressed " } else { "" }
   );

   let diff = Diff {
      actual,
      expected,
   };

   if std::env::var("DIFF").unwrap_or_default() == "0" {
      assert_eq!(
         diff.expected, diff.actual,
         "Actual:\n{}",
         diff.actual
      );
   } else {
      pretty_assertions::assert_eq!(
         diff.expected,
         diff.actual,
         "Actual:\n{}",
         diff.actual
      );
   }
   unreachable!();
}

struct TestContent {
   input: String,
   output: String,
   output_compressed: Option<String>,
}

fn format_test_content(content: &str) -> TestContent {
   let mut shared = String::new();
   let mut input = String::new();
   let mut output = String::new();
   let mut output_compressed = String::new();

   let mut current = &mut shared;

   for line in content.lines() {
      match line.trim() {
         "// input" => current = &mut input,
         "// output" => current = &mut output,
         "// output.compressed" => current = &mut output_compressed,
         _ => {
            // Skip comments prefixed with `$$`.
            if !line.starts_with("// $$ ") {
               current.push_str(line);
               current.push('\n');
            }
         }
      }
   }

   input.insert_str(0, &shared);
   output.insert_str(0, &shared);

   if !output_compressed.is_empty() {
      output_compressed.insert_str(0, &shared);
   }

   return TestContent {
      input,
      output,
      output_compressed: if output_compressed.is_empty() {
         None
      } else {
         Some(output_compressed)
      },
   };
}
