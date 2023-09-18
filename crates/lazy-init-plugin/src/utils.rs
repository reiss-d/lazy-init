use swc_ecma_ast::Ident;
use swc_ecma_utils::private_ident;

#[cfg(not(feature = "use-testing"))]
use rand::{distributions::Alphanumeric, thread_rng, Rng};

#[cfg(feature = "use-testing")]
pub fn rand_string() -> String {
    return "uniquekey123".to_owned();
}
#[cfg(not(feature = "use-testing"))]
pub fn rand_string() -> String {
    return thread_rng()
        .sample_iter(&Alphanumeric)
        .take(12)
        .map(char::from)
        .collect();
}

#[cfg(feature = "use-testing")]
pub fn lazy_identifier() -> Ident {
    return private_ident!("lzVar");
}
#[cfg(not(feature = "use-testing"))]
pub fn lazy_identifier() -> Ident {
    return private_ident!("lv");
}
