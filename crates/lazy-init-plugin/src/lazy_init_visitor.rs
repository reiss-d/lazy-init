use super::*;
use std::collections::HashSet;
use swc_core::{
    common::{util::take::Take, DUMMY_SP},
    ecma::{
        atoms::JsWord,
        utils::{undefined, ExprFactory},
        visit::{noop_visit_mut_type, VisitMut, VisitMutWith},
    },
};
use tracing::debug;
use utils;

#[derive(Debug, Default)]
struct LazyFnsState {
    populated: bool,
    names: HashSet<JsWord>,
    imported_names: HashSet<Id>,
}

#[derive(Debug, Default)]
pub struct TransformVisitor {
    config: configs::PluginConfig,
    import_sources: HashSet<JsWord>,
    lazy_fns: LazyFnsState,
    lazy_vars_inserted: Vec<VarDeclarator>,
}

impl TransformVisitor {
    pub fn new(mut config: configs::PluginConfig) -> Self {
        let mut import_sources = HashSet::new();

        if !config.ignore_lazy_library {
            for source in ["lazy-init", "lazy-init/cache"] {
                import_sources.insert(source.into());
            }
        }

        for source in config.import_sources.drain(..) {
            import_sources.insert(source.into());
        }

        return Self {
            config,
            import_sources,
            ..Default::default()
        };
    }

    // We only want to populate the state once we know we have imported from one
    // of the configured import_sources.
    fn populate_lazy_fns_state(&mut self) {
        true_or_return!(!self.lazy_fns.populated);
        self.lazy_fns.populated = true;

        let methods = ["lz", "lazyAsync", "lazyFn"].into_iter().chain(
            self.config
                .lazy_fns
                .iter()
                .map(std::string::String::as_str),
        );

        for fn_name in methods {
            self.lazy_fns.names.insert(fn_name.into());
        }
    }

    fn is_import_source(&self, value: &JsWord) -> bool {
        return self.import_sources.contains(value);
    }

    fn is_lazy_fn(&self, value: &JsWord) -> bool {
        return self.lazy_fns.names.contains(value);
    }

    fn is_imported_lazy_fn(&self, value: &Ident) -> bool {
        return self
            .lazy_fns
            .imported_names
            .contains(&value.to_id());
    }

    fn skip_lazy_fns(&self) -> bool {
        return self.lazy_fns.imported_names.is_empty();
    }

    fn create_var_declaration(&mut self) -> Decl {
        return Decl::Var(Box::new(VarDecl {
            span: DUMMY_SP,
            kind: VarDeclKind::Var,
            declare: false,
            decls: self.lazy_vars_inserted.drain(..).collect(),
        }));
    }
}

impl VisitMut for TransformVisitor {
    noop_visit_mut_type!();

    fn visit_mut_call_expr(&mut self, call_expr: &mut CallExpr) {
        debug!("visit_mut_call_expr");
        // skip if no import call was found
        true_or_return!(!self.skip_lazy_fns());

        call_expr.visit_mut_children_with(self);

        // all methods require args
        true_or_return!(!&call_expr.args.is_empty());

        let callee_expr = some_or_return!(call_expr.callee.as_expr());
        let callee_ident;
        let callee_method;

        if let Expr::Member(member) = &**callee_expr {
            callee_ident = some_or_return!(member.obj.as_ident());
            true_or_return!(self.is_imported_lazy_fn(callee_ident));

            callee_method = if let MemberProp::Ident(i) = &member.prop {
                Some(&i.sym)
            } else {
                None
            };
        } else {
            callee_ident = some_or_return!(callee_expr.as_ident());
            true_or_return!(self.is_imported_lazy_fn(callee_ident));

            callee_method = None;
        };

        let mut lazy_args = call_expr.args.take();
        let mut is_async = false;

        if let Some(method) = callee_method {
            match &**method {
                "fn" => {
                    // may be needed in the future
                }
                "async" => {
                    is_async = true;
                }
                _ => {
                    // may be needed in the future
                }
            }
        } else {
            // TODO: using exported functions not supported yet
            if &callee_ident.sym == "lazyAsync" {
                is_async = true;
            }
        }

        if is_async {
            let no_options_arg = lazy_args.get(1).is_none();

            if no_options_arg {
                lazy_args.insert(1, undefined(DUMMY_SP).as_arg());
            }
            // pass unique key as third argument
            lazy_args.insert(
                2,
                Str {
                    span: DUMMY_SP,
                    value: utils::rand_string().into(),
                    raw: None,
                }
                .as_arg(),
            );
        }

        let mut initializer = Box::new(Expr::Call(CallExpr {
            span: DUMMY_SP,
            callee: call_expr.callee.take(),
            args: lazy_args,
            type_args: None,
        }));

        if is_async {
            // `await initializer()`
            initializer = Box::new(Expr::Await(AwaitExpr {
                span: DUMMY_SP,
                arg: initializer,
            }));
        }

        let lazy_var = create_lazy_var();
        self.lazy_vars_inserted.push(lazy_var.declarator);

        // `lazyVar = initializer()`
        let assign_to_lazy_var =
            Box::new(initializer.make_assign_to(
                op!("="),
                lazy_var.ident.clone().as_pat_or_expr(),
            ));
        // `lazyVar ?? (lazyVar = initializer())`
        let mut get_or_initialize = Expr::Ident(lazy_var.ident).make_bin(
            op!("??"),
            Expr::Paren(ParenExpr {
                span: DUMMY_SP,
                expr: assign_to_lazy_var,
            }),
        );

        if is_async {
            // `(lazyVar ?? (lazyVar = await initializer()))`
            get_or_initialize = get_or_initialize.wrap_with_paren();
        }

        call_expr.args = vec![
            ExprOrSpread {
                spread: None,
                expr: Box::new(get_or_initialize),
            };
            1
        ];

        // drop the function call but keep the parentheses
        // TODO: is there a better way to do this? much easier than finding
        // the parent node and replacing the actual call expression.
        call_expr.callee = replace_identity_fn();
    }

    fn visit_mut_import_decl(&mut self, import_decl: &mut ImportDecl) {
        // import {} from "[import_source]"
        let import_source = &import_decl.src.value;

        true_or_return!(self.is_import_source(import_source));

        for specifier in &import_decl.specifiers {
            let imported_fn;
            let fn_local_ident;
            let mut is_default = false;

            match specifier {
                ImportSpecifier::Named(named_specifier) => {
                    imported_fn = match &named_specifier.imported {
                        // import {[fn]} from "[import_source]";
                        Some(ModuleExportName::Ident(named_ident)) => {
                            &named_ident.sym
                        }
                        Some(ModuleExportName::Str(named_lit)) => {
                            &named_lit.value
                        }
                        // import {[fn] as foo} from "[import_source]";
                        _ => &named_specifier.local.sym,
                    };
                    fn_local_ident = &named_specifier.local;
                }
                ImportSpecifier::Default(default_specifier) => {
                    imported_fn = &default_specifier.local.sym;
                    fn_local_ident = &default_specifier.local;
                    is_default = true;
                }
                _ => {
                    return;
                }
            };

            self.populate_lazy_fns_state();

            if is_default || self.is_lazy_fn(imported_fn) {
                self.lazy_fns
                    .imported_names
                    .insert(fn_local_ident.to_id());
            }
        }
    }

    fn visit_mut_module_items(&mut self, items: &mut Vec<ModuleItem>) {
        debug!("visit_mut_module_items");
        items.visit_mut_children_with(self);

        if !self.lazy_vars_inserted.is_empty() {
            debug!("inserting var declaration");
            insert_item_after_imports(
                items,
                ModuleItem::Stmt(Stmt::Decl(self.create_var_declaration())),
            );
        }
    }

    // TODO: implement this if needed?
    // fn visit_mut_script(&mut self, node: &mut Script) {
    //     debug!("visit_mut_script");
    //     node.visit_mut_children_with(self);
    // }
}

struct LazyVar {
    ident: Ident,
    declarator: VarDeclarator,
}

fn create_lazy_var() -> LazyVar {
    let ident = utils::lazy_identifier();

    return LazyVar {
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

fn insert_item_after_imports(
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
            return !matches!(
                item.as_module_decl(),
                Some(ModuleDecl::Import(_))
            );
        })
        .unwrap_or(items.len());
    items.insert(idx, to_insert);
}

fn replace_identity_fn() -> Callee {
    return Ident {
        span: DUMMY_SP,
        sym: "".into(),
        optional: false,
    }
    .as_callee();
}
