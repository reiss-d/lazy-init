// @ts-nocheck
import { lz, block } from "lazy-init";

// input
export const t0 = lz.block(() => {
    if (condA) return 0;
    if (condB) return 1;
    return 2;
});

export const t1 = block(() => {
    if (condA) { return 0; }
    else if (condB) { return 1; }
    else { return 2; }
});

// output
var lzVar;
if (condA) {
    lzVar = 0;
} else {
    if (condB) {
        lzVar = 1;
    } else {
        lzVar = 2;
    }
}
export const t0 = lzVar;

var lzVar1;
if (condA) {
    lzVar1 = 0;
} else {
    if (condB) {
        lzVar1 = 1;
    } else {
        lzVar1 = 2;
    }
}
export const t1 = lzVar1;

// output.compressed
var lzVar;
lzVar = condA ? 0 : condB ? 1 : 2;
export const t0 = lzVar;

var lzVar1;
lzVar1 = condA ? 0 : condB ? 1 : 2;
export const t1 = lzVar1;
