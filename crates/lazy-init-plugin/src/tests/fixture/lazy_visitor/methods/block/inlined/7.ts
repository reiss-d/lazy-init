// @ts-nocheck
import { lz, block } from "lazy-init";

// input
export const t0 = lz.block(() => {
    const inner = block(() => {
        if (cond) {
            return 0;
        }
        return 1;
    });
    return inner + 1;
});

export const t1 = block(() => {
    if (cond) {
        const inner0 = lz.block(() => {
            switch (val) {
                case A: {
                    return 0;
                }
                case B: {
                    const inner1 = block(() => {
                        if (condInner) { return 1; }
                        throw new Error("inner1");
                    });
                    return inner1;
                }
                default: {
                    return 2;
                }
            }
        });
        return inner0 + 1;
    } else {
        return 1;
    }
});

// output
var lzVar;
var lzVar1;
if (cond) {
    lzVar1 = 0;
} else {
    lzVar1 = 1;
}
const inner = lzVar1;
lzVar = inner + 1;
export const t0 = lzVar;

var lzVar2;
if (cond) {
    var lzVar3;
    switch(val){
        case A:
            {
                lzVar3 = 0;
                break;
            }
        case B:
            {
                var lzVar4;
                if (condInner) {
                    lzVar4 = 1;
                } else {
                    throw new Error("inner1");
                }
                const inner1 = lzVar4;
                lzVar3 = inner1;
                break;
            }
        default:
            {
                lzVar3 = 2;
                break;
            }
    }
    const inner0 = lzVar3;
    lzVar2 = inner0 + 1;
} else {
    lzVar2 = 1;
}
export const t1 = lzVar2;

// output.compressed
var lzVar;
var lzVar1;
lzVar1 = cond ? 0 : 1;
const inner = lzVar1;
lzVar = inner + 1;
export const t0 = lzVar;

var lzVar2;
if (cond) {
    var lzVar3;
    switch(val){
        case A:
            {
                lzVar3 = 0;
                break;
            }
        case B:
            {
                var lzVar4;
                if (condInner) {
                    lzVar4 = 1;
                } else {
                    throw Error("inner1");
                }
                const inner1 = lzVar4;
                lzVar3 = inner1;
                break;
            }
        default:
            {
                lzVar3 = 2;
                break;
            }
    }
    const inner0 = lzVar3;
    lzVar2 = inner0 + 1;
} else {
    lzVar2 = 1;
}
export const t1 = lzVar2;
