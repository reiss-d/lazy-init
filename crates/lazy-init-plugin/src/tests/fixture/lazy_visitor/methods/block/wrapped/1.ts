// $$ Note - `t0` becomes inline for compressed output.
// @ts-nocheck
import { lz, block } from "lazy-init";

// input
export const t0 = lz.block(() => {
    if (condA) return "A";
    if (condB) return "B";
    fallthrough();
});

export const t1 = block(() => {
    if (condA) {
        if (condB) {
            return "B";
        }
        fallthrough();
    }
    return "C";
});

// output
var lzVar;
Block: {
    if (condA) {
        lzVar = "A";
        break Block;
    } else {
        if (condB) {
            lzVar = "B";
            break Block;
        } else {
            fallthrough();
        }
    }
}
export const t0 = lzVar;

var lzVar1;
Block: {
    if (condA) {
        if (condB) {
            lzVar1 = "B";
            break Block;
        } else {
            fallthrough();
        }
    }
    lzVar1 = "C";
    break Block;
}
export const t1 = lzVar1;

// output.compressed
var lzVar;
lzVar = condA ? "A" : condB ? "B" : void fallthrough();
export const t0 = lzVar;

var lzVar1;
Block: {
    if (condA) {
        if (condB) {
            lzVar1 = "B";
            break Block;
        } else {
            fallthrough();
        }
    }
    lzVar1 = "C";
    break Block;
}
export const t1 = lzVar1;
