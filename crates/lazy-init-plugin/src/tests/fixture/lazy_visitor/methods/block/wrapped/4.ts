// $$ Note - `t1` becomes inline for compressed output.
// @ts-nocheck
import { lz, block } from "lazy-init";

// input
export const t0 = lz.block(() => {
    switch (val) {
        case A: return 1;
        case B: return 2;
    }
    return 0;
});

export const t1 = block(() => {
    switch (val) {
        case A: break;
        case B: return 1;
        default: return 2;
    }
    return 0;
});

// output
var lzVar;
Block: {
    switch(val){
        case A:
            lzVar = 1;
            break Block;
        case B:
            lzVar = 2;
            break Block;
    }
    lzVar = 0;
    break Block;
}
export const t0 = lzVar;

var lzVar1;
Block: {
    switch(val){
        case A:
            break;
        case B:
            lzVar1 = 1;
            break Block;
        default:
            lzVar1 = 2;
            break Block;
    }
    lzVar1 = 0;
    break Block;
}
export const t1 = lzVar1;

// output.compressed
var lzVar;
Block: {
    switch(val){
        case A:
            lzVar = 1;
            break Block;
        case B:
            lzVar = 2;
            break Block;
    }
    lzVar = 0;
    break Block;
}
export const t0 = lzVar;

var lzVar1;
Block: {
    switch(val){
        case A:
            break;
        case B:
            lzVar1 = 1;
            break Block;
        default:
            lzVar1 = 2;
            break Block;
    }
    lzVar1 = 0;
    break Block;
}
export const t1 = lzVar1;
