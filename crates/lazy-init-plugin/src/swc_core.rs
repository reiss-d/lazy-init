pub use swc_core::*;

#[cfg(feature = "use-swc_core_v076")]
use swc_core_v076 as swc_core;

#[cfg(feature = "use-swc_core_v075")]
use swc_core_v075 as swc_core;
