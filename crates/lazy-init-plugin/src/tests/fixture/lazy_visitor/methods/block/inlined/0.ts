// @ts-nocheck
import { lz, block } from "lazy-init";

// input
export const t0 = lz.block(() => {
    if (cond) { return 0; }
    else { return 1; }
});

export const t1 = lz.block(() => {
    if (cond) return 0;
    else return 1;
});

export const t2 = lz.block(() => {
    if (cond) { return 0; }
    else return 1;
});

export const t3 = lz.block(() => {
    if (cond) return 0;
    else { return 1; }
});

export const t4 = block(() => {
    if (cond) { return 0; }
    return 1;
});

export const t5 = block(() => {
    if (cond) return 0;
    return 1;
});

// output
var lzVar;
if (cond) {
    lzVar = 0;
} else {
    lzVar = 1;
}
export const t0 = lzVar;

var lzVar1;
if (cond) {
    lzVar1 = 0;
} else {
    lzVar1 = 1;
}
export const t1 = lzVar1;

var lzVar2;
if (cond) {
    lzVar2 = 0;
} else {
    lzVar2 = 1;
}
export const t2 = lzVar2;

var lzVar3;
if (cond) {
    lzVar3 = 0;
} else {
    lzVar3 = 1;
}
export const t3 = lzVar3;

var lzVar4;
if (cond) {
    lzVar4 = 0;
} else {
    lzVar4 = 1;
}
export const t4 = lzVar4;

var lzVar5;
if (cond) {
    lzVar5 = 0;
} else {
    lzVar5 = 1;
}
export const t5 = lzVar5;

// output.compressed
var lzVar;
lzVar = cond ? 0 : 1;
export const t0 = lzVar;

var lzVar1;
lzVar1 = cond ? 0 : 1;
export const t1 = lzVar1;

var lzVar2;
lzVar2 = cond ? 0 : 1;
export const t2 = lzVar2;

var lzVar3;
lzVar3 = cond ? 0 : 1;
export const t3 = lzVar3;

var lzVar4;
lzVar4 = cond ? 0 : 1;
export const t4 = lzVar4;

var lzVar5;
lzVar5 = cond ? 0 : 1;
export const t5 = lzVar5;
