#[macro_export]
macro_rules! unwrap_or {
    ($option:expr, $or:expr) => {
        if let Some(s) = $option {
            s
        } else {
            $or
        }
    };
}

#[macro_export]
macro_rules! some_or_return {
    ($option:expr) => {
        unwrap_or!($option, return)
    };
    ($option:expr, $ret:expr) => {
        unwrap_or!($option, return $ret)
    };
}

#[macro_export]
macro_rules! equals_or_return {
    ($a:expr, $b:expr) => {
        if $a == $b {
        } else {
            return;
        }
    };
    ($a:expr, $b:expr, $ret:expr) => {
        if $a == $b {
        } else {
            return $ret;
        }
    };
}

#[macro_export]
macro_rules! true_or_return {
    ($bool_val:expr) => {
        equals_or_return!($bool_val, true);
    };
    ($bool_val:expr, $on_false:expr) => {
        equals_or_return!($bool_val, true, $on_false)
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
