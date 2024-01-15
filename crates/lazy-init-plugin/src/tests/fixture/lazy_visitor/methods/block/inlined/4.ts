// @ts-nocheck
import { lz, block } from "lazy-init";

// input
export const t0 = lz.block(() => {
    switch (val) {
        case A: return 0;
        case B: return 1;
        default: return 2;
    }
});

export const t1 = block(() => {
    switch (val) {
        case A: {
            return 0;
        }
        case B: {
            return 1;
        }
        default: {
            return 2;
        }
    }
});
export const t2 = lz.block(() => {
    switch (val) {
        case A:
        case B: {
            return 1;
        }
        default: {
            return 2;
        }
    }
});

export const t3 = block(() => {
    switch (val) {
        case A: {
            val += A;
            break;
        }
        case B: {
            val += B;
        }
        default: {
            val += 10;
        }
    }
    return 0;
});

// output
var lzVar;
switch(val){
    case A:
        lzVar = 0;
        break;
    case B:
        lzVar = 1;
        break;
    default:
        lzVar = 2;
        break;
}
export const t0 = lzVar;

var lzVar1;
switch(val){
    case A:
        {
           lzVar1 = 0;
           break;
        }
    case B:
        {
           lzVar1 = 1;
           break;
        }
    default:
        {
           lzVar1 = 2;
           break;
        }
}
export const t1 = lzVar1;

var lzVar2;
switch(val){
    case A:
    case B:
        {
           lzVar2 = 1;
           break;
        }
    default:
        {
           lzVar2 = 2;
           break;
        }
}
export const t2 = lzVar2;

var lzVar3;
switch(val){
    case A:
        {
           val += A;
           break;
        }
    case B:
        {
           val += B;
        }
    default:
        {
           val += 10;
        }
}
lzVar3 = 0;
export const t3 = lzVar3;

// output.compressed
var lzVar;
switch(val){
    case A:
        lzVar = 0;
        break;
    case B:
        lzVar = 1;
        break;
    default:
        lzVar = 2;
        break;
}
export const t0 = lzVar;

var lzVar1;
switch(val){
    case A:
        lzVar1 = 0;
        break;
    case B:
        lzVar1 = 1;
        break;
    default:
        lzVar1 = 2;
        break;
}
export const t1 = lzVar1;

var lzVar2;
switch(val){
    case A:
    case B:
        lzVar2 = 1;
        break;
    default:
        lzVar2 = 2;
        break;
}
export const t2 = lzVar2;

var lzVar3;
switch(val){
    case A:
        val += A;
        break;
    case B:
        val += B;
    default:
        val += 10;
}
lzVar3 = 0;
export const t3 = lzVar3;
