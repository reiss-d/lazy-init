// @ts-nocheck
import { lz, block } from "lazy-init";

// input
export const t0 = lz.block(() => {
    if (A) {
        if (B) {
            return 0;
        } else {
            return 1;
        }
    } else {
        if (C) {
            return 0;
        } else {
            return 1;
        }
    }
});

export const t1 = block(() => {
    if (A) {
        if (B) {
            return 0;
        } else {
            return 1;
        }
    }
    if (C) {
        return 0;
    } else {
        return 1;
    }
});

// output
var lzVar;
if (A) {
    if (B) {
        lzVar = 0;
    } else {
        lzVar = 1;
    }
} else {
    if (C) {
        lzVar = 0;
    } else {
        lzVar = 1;
    }
}
export const t0 = lzVar;

var lzVar1;
if (A) {
    if (B) {
        lzVar1 = 0;
    } else {
        lzVar1 = 1;
    }
} else {
    if (C) {
        lzVar1 = 0;
    } else {
        lzVar1 = 1;
    }
}
export const t1 = lzVar1;

// output.compressed
var lzVar;
lzVar = A ? B ? 0 : 1 : C ? 0 : 1;
export const t0 = lzVar;

var lzVar1;
lzVar1 = A ? B ? 0 : 1 : C ? 0 : 1;
export const t1 = lzVar1;
