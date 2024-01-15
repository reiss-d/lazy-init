// $$ Note - `t1` becomes inline for compressed output.
// @ts-nocheck
import { lz, block } from "lazy-init";

// input
export const t0 = lz.block(() => {
    if (condA) { throw new Error("A"); }
    if (condB) return "B";
    fallthrough();
});

export const t1 = block(() => {
    if (condA) {
        if (condB) {
            throw new Error("B");
        }
        fallthrough();
    }
    return "C";
});

// output
var lzVar;
Block: {
    if (condA) {
        throw new Error("A");
    }
    if (condB) {
        lzVar = "B";
        break Block;
    } else {
        fallthrough();
    }
}
export const t0 = lzVar;
var lzVar1;
if (condA) {
    if (condB) {
        throw new Error("B");
    }
    fallthrough();
}
lzVar1 = "C";
export const t1 = lzVar1;

// output.compressed
var lzVar;
Block: {
    if (condA) {
        throw Error("A");
    }
    if (condB) {
        lzVar = "B";
        break Block;
    } else {
        fallthrough();
    }
}
export const t0 = lzVar;

var lzVar1;
if (condA) {
    if (condB) {
        throw Error("B");
    }
    fallthrough();
}
lzVar1 = "C";
export const t1 = lzVar1;
