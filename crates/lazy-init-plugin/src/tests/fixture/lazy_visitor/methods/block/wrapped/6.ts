// $$ Note - `t1` becomes inline for compressed output.
// @ts-nocheck
import { lz, block } from "lazy-init";

// input
export const t0 = lz.block(() => {
    for (let i = 0; i < 5; i++) {
        if (cond) { break; }
        return 0;
    }
    return 1;
});

export const t1 = block(() => {
    label: for (let i = 0; i < 5; i++) {
        if (cond) { break label; }
        return 0;
    }
    return 1;
});

export const t2 = lz.block(() => {
    label: switch (val) {
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

export const t3 = block(() => {
    label: {
        return 0;
    }
});

// output
var lzVar;
Block: {
    for(let i = 0; i < 5; i++){
        if (cond) {
            break;
        }
        lzVar = 0;
        break Block;
    }
    lzVar = 1;
    break Block;
}
export const t0 = lzVar;

var lzVar1;
Block: {
    label: for(let i = 0; i < 5; i++){
        if (cond) {
            break label;
        }
        lzVar1 = 0;
        break Block;
    }
    lzVar1 = 1;
    break Block;
}
export const t1 = lzVar1;

var lzVar2;
Block: {
    label: switch(val){
        case A:
            {
                lzVar2 = 0;
                break Block;
            }
        case B:
            {
                lzVar2 = 1;
                break Block;
            }
        default:
            {
                lzVar2 = 2;
                break Block;
            }
    }
}
export const t2 = lzVar2;

var lzVar3;
Block: {
    label: {
        lzVar3 = 0;
        break Block;
    }
}
export const t3 = lzVar3;

// output.compressed
var lzVar;
Block: {
    for(let i = 0; i < 5 && !cond; i++){
        ;
        lzVar = 0;
        break Block;
    }
    lzVar = 1;
    break Block;
}
export const t0 = lzVar;

var lzVar1;
Block: {
    for(let i = 0; i < 5 && !cond; i++){
        lzVar1 = 0;
        break Block;
    }
    lzVar1 = 1;
    break Block;
}
export const t1 = lzVar1;

var lzVar2;
switch(val){
    case A:
        lzVar2 = 0;
        break;
    case B:
        lzVar2 = 1;
        break;
    default:
        lzVar2 = 2;
        break;
}
export const t2 = lzVar2;

var lzVar3;
lzVar3 = 0;
export const t3 = lzVar3;
