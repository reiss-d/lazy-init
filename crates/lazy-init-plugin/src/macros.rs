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
}

#[macro_export]
macro_rules! equals_or_return {
    ($a:expr, $b:expr) => {
        if $a == $b {
        } else {
            return;
        }
    };
    ($a:expr, $b:expr, $before_return:expr) => {
        if $a == $b {
        } else {
            $before_return;
            return;
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
