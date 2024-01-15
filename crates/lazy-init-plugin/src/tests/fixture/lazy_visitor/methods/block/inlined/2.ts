// $$ TODO: investigate why compressed output of `t0` is strange?
// @ts-nocheck
import { lz, block } from "lazy-init";

// input
export const t0 = lz.block(() => {
    if (cond) { throw new Error("t0"); }
    else { return 1; }
});

export const t1 = block(() => {
    if (cond) { throw new Error("t1"); }
    return 1;
});

// output
var lzVar;
if (cond) {
    throw new Error("t0");
} else {
    lzVar = 1;
}
export const t0 = lzVar;

var lzVar1;
if (cond) {
    throw new Error("t1");
}
lzVar1 = 1;
export const t1 = lzVar1;

// output.compressed
var lzVar;
if (!cond) {
    lzVar = 1;
} else {
    throw Error("t0");
}
export const t0 = lzVar;

var lzVar1;
if (cond) {
    throw Error("t1");
}
lzVar1 = 1;
export const t1 = lzVar1;
