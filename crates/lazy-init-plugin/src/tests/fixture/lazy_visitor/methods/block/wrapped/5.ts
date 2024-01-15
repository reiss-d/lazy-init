// $$ Note - `t1` becomes inline for compressed output.
// @ts-nocheck
import { lz, block } from "lazy-init";

// input
export const t0 = lz.block(() => {
    try {
        maybe();
    } catch (error) {
        return passed();
    } finally {
        then();
    }
});

export const t1 = block(() => {
    try {
        return passed();
    } catch (error) {
        failed();
    } finally {
        then();
    }
});

export const t2 = lz.block(() => {
    try {
        maybe();
    } catch (error) {
        return failed();
    } finally {
        then();
    }
});

export const t3 = block(() => {
    try {
        return passed();
    } catch (error) {
        failed();
    }
});

export const t4 = lz.block(() => {
    try {
        maybe();
    } catch (error) {
        return failed();
    }
});

export const t5 = lz.block(() => {
    if (cond) {
        try {
            maybe();
        } catch (error) {
            return failed();
        }
    } else {
        return 1;
    }
});

// output
var lzVar;
Block: {
    try {
        maybe();
    } catch (error) {
        lzVar = passed();
        break Block;
    } finally{
        then();
    }
}
export const t0 = lzVar;

var lzVar1;
Block: {
    try {
        lzVar1 = passed();
        break Block;
    } catch (error) {
        failed();
    } finally{
        then();
    }
}
export const t1 = lzVar1;

var lzVar2;
Block: {
    try {
        maybe();
    } catch (error) {
        lzVar2 = failed();
        break Block;
    } finally{
        then();
    }
}
export const t2 = lzVar2;

var lzVar3;
Block: {
    try {
        lzVar3 = passed();
        break Block;
    } catch (error) {
        failed();
    }
}
export const t3 = lzVar3;

var lzVar4;
Block: {
    try {
        maybe();
    } catch (error) {
        lzVar4 = failed();
        break Block;
    }
}
export const t4 = lzVar4;

var lzVar5;
Block: {
    if (cond) {
        try {
            maybe();
        } catch (error) {
            lzVar5 = failed();
            break Block;
        }
    } else {
        lzVar5 = 1;
        break Block;
    }
}
export const t5 = lzVar5;

// output.compressed
var lzVar;
Block: {
    try {
        maybe();
    } catch (error) {
        lzVar = passed();
        break Block;
    } finally{
        then();
    }
}
export const t0 = lzVar;

var lzVar1;
Block: {
    try {
        lzVar1 = passed();
        break Block;
    } catch (error) {
        failed();
    } finally{
        then();
    }
}
export const t1 = lzVar1;

var lzVar2;
Block: {
    try {
        maybe();
    } catch (error) {
        lzVar2 = failed();
        break Block;
    } finally{
        then();
    }
}
export const t2 = lzVar2;

var lzVar3;
Block: {
    try {
        lzVar3 = passed();
        break Block;
    } catch (error) {
        failed();
    }
}
export const t3 = lzVar3;

var lzVar4;
Block: {
    try {
        maybe();
    } catch (error) {
        lzVar4 = failed();
        break Block;
    }
}
export const t4 = lzVar4;

var lzVar5;
Block: {
    if (!cond) {
        lzVar5 = 1;
        break Block;
    } else {
        try {
            maybe();
        } catch (error) {
            lzVar5 = failed();
            break Block;
        }
    }
}
export const t5 = lzVar5;
