// @ts-nocheck
import { lz, lzc } from "lazy-init";

var lzVar, lzVar1, lzVar2, lzVar3, lzVar4, lzVar5, lzVar6, lzVar7, lzVar8, lzVar9, lzVar10, lzVar11, lzVar12, lzVar13;

export const base = ()=>{
    const lz_a0 = (lzVar ?? (lzVar = lz({
        "a": 0
    })));
    const lz_b0 = (lzVar1 ?? (lzVar1 = lz({
        "b": 0
    }, true)));
    const lz_b1 = (lzVar2 ?? (lzVar2 = lz({
        "b": 1
    }, false)));
    const lz_c0 = (lzVar3 ?? (lzVar3 = lz({
        "c": 0
    }, {})));
    const lz_c1 = (lzVar4 ?? (lzVar4 = lz({
        "c": 1
    }, {
        cache: true
    })));
    const lz_c2 = (lzVar5 ?? (lzVar5 = lz({
        "c": 2
    }, {
        freeze: true
    })));
    const lz_c3 = (lzVar6 ?? (lzVar6 = lz({
        "c": 3
    }, {
        cache: true,
        freeze: true
    })));
    const lzc_a0 = (lzVar7 ?? (lzVar7 = lzc({
        "a": 0
    })));
    const lzc_b0 = (lzVar8 ?? (lzVar8 = lzc({
        "b": 0
    }, true)));
    const lzc_b1 = (lzVar9 ?? (lzVar9 = lzc({
        "b": 1
    }, false)));
    const lzc_c0 = (lzVar10 ?? (lzVar10 = lzc({
        "c": 0
    }, {})));
    const lzc_c1 = (lzVar11 ?? (lzVar11 = lzc({
        "c": 1
    }, {
        cache: true
    })));
    const lzc_c2 = (lzVar12 ?? (lzVar12 = lzc({
        "c": 2
    }, {
        freeze: true
    })));
    const lzc_c3 = (lzVar13 ?? (lzVar13 = lzc({
        "c": 3
    }, {
        cache: true,
        freeze: true
    })));
};
