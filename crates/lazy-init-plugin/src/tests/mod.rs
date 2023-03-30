#[allow(clippy::needless_pass_by_value)]
#[cfg(feature = "use-testing")]
#[cfg(test)]
pub mod test_fixture {
    use crate::{configs, lazy_init_visitor, swc_core};
    use configs::PluginConfig;
    use lazy_init_visitor::TransformVisitor;
    use std::path::PathBuf;
    use swc_core::{
        common::{chain, Mark},
        ecma::{
            parser::{Syntax, TsConfig},
            transforms::{
                base::resolver,
                testing::{test_fixture, FixtureTestConfig},
            },
            visit::{as_folder, Fold, VisitMut},
        },
    };
    use testing::fixture;

    #[fixture("src/tests/fixture/**/input.ts")]
    fn lazy_init_fixture(input: PathBuf) {
        let output = input
            .parent()
            .expect("failed to find test fixture")
            .join("output.ts");

        test_fixture(
            ts_syntax(),
            &|_tr| {
                return chain!(
                    resolver(Mark::new(), Mark::new(), false),
                    transform_visitor(PluginConfig::default())
                );
            },
            &input,
            &output,
            FixtureTestConfig::default(),
        );
    }

    fn transform_visitor(
        config: PluginConfig,
    ) -> impl 'static + Fold + VisitMut {
        return as_folder(TransformVisitor::new(config));
    }

    fn ts_syntax() -> Syntax {
        return Syntax::Typescript(TsConfig {
            tsx: false,
            ..Default::default()
        });
    }
}
