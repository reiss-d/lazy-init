// @ts-nocheck
import { lz, block } from "lazy-init";

// input
export const t0 = lz.block(() => {
    if (cond) { return 0; }
    else { fallthrough(); }
});

export const t1 = block(() => {
    if (cond) { fallthrough(); }
    else { return 1; }
});

export const t2 = lz.block(() => {
    if (cond) { return 0; }
    fallthrough();
});

export const t3 = block(() => {
    if (cond) { return 0; }
});

// output
var lzVar;
Block: {
    if (cond) {
        lzVar = 0;
        break Block;
    } else {
        fallthrough();
    }
}
export const t0 = lzVar;

var lzVar1;
Block: {
    if (cond) {
        fallthrough();
    } else {
        lzVar1 = 1;
        break Block;
    }
}
export const t1 = lzVar1;

var lzVar2;
Block: {
    if (cond) {
        lzVar2 = 0;
        break Block;
    } else {
        fallthrough();
    }
}
export const t2 = lzVar2;

var lzVar3;
Block: {
    if (cond) {
        lzVar3 = 0;
        break Block;
    }
}
export const t3 = lzVar3;

// output.compressed
var lzVar;
Block: {
    if (cond) {
        lzVar = 0;
        break Block;
    } else {
        fallthrough();
    }
}
export const t0 = lzVar;

var lzVar1;
Block: {
    if (!cond) {
        lzVar1 = 1;
        break Block;
    } else {
        fallthrough();
    }
}
export const t1 = lzVar1;

var lzVar2;
Block: {
    if (cond) {
        lzVar2 = 0;
        break Block;
    } else {
        fallthrough();
    }
}
export const t2 = lzVar2;

var lzVar3;
Block: {
    if (cond) {
        lzVar3 = 0;
        break Block;
    }
}
export const t3 = lzVar3;
