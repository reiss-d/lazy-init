use super::*;

#[derive(Debug, Default, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
#[serde(deny_unknown_fields)]
pub struct PluginConfig {
    /// The modules where custom lazy functions are defined.
    ///
    /// Example:
    /// ```ts
    /// import { lz } from "lazy-init";
    /// import { customLazy } from "@myorg/lazy";
    /// ```
    /// where `import_sources` is `["@myorg/lazy"]`.
    ///
    /// Note: `"lazy-init"` is included by default, unless
    /// explicitly disabled (see `ignore_lazy_library`).
    #[serde(default)]
    pub import_sources: Vec<String>,

    /// Names of custom lazy functions.
    ///
    /// Example:
    /// ```ts
    /// import { customLazy } from "@myorg/lazy";
    /// ```
    /// where `lazyFns` is `["customLazy"]`.
    ///
    /// Note: all functions exported from `"lazy-init"` are
    /// **always** included by default.
    // #[serde(default = "default_lazy_function")]
    #[serde(default)]
    pub lazy_fns: Vec<String>,

    /// Do not check for imports from the `"lazy-init"` library.
    ///
    /// Set to `true` if you are solely using a custom lazy function
    /// from a different library.
    #[serde(default)]
    pub ignore_lazy_library: bool,

    /// Disable this plugin.
    #[serde(default)]
    pub disable: bool,
}
