// $$ Note - `t1` becomes inline for compressed output.
// @ts-nocheck
import { lz, block } from "lazy-init";

// input
export const t0 = lz.block(() => {
    if (A) {
        if (B) {
            fallthrough();
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
        fallthrough();
    }
});

// output
var lzVar;
Block: {
    if (A) {
        if (B) {
            fallthrough();
        } else {
            lzVar = 1;
            break Block;
        }
    } else {
        if (C) {
            lzVar = 0;
            break Block;
        } else {
            lzVar = 1;
            break Block;
        }
    }
}
export const t0 = lzVar;
var lzVar1;
Block: {
    if (A) {
        if (B) {
            lzVar1 = 0;
            break Block;
        } else {
            lzVar1 = 1;
            break Block;
        }
    } else {
        if (C) {
            lzVar1 = 0;
            break Block;
        } else {
            fallthrough();
        }
    }
}
export const t1 = lzVar1;

// output.compressed
var lzVar;
lzVar = A ? B ? void fallthrough() : 1 : C ? 0 : 1;
export const t0 = lzVar;
var lzVar1;
lzVar1 = A ? B ? 0 : 1 : C ? 0 : void fallthrough();
export const t1 = lzVar1;
