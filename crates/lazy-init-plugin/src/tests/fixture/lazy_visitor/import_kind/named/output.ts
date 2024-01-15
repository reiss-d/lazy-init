// @ts-nocheck
import { lz, lzc } from "lazy-init";
var lzVar, lzVar1, lzVar2, lzVar3, lzVar4, lzVar5;
export const someFn = ()=>{
    const lz_a0 = (lzVar ?? (lzVar = lz({
        "a": 0
    })));
    const lz_b0 = (lzVar1 ?? (lzVar1 = lz.fn(()=>({
            "b": 0
        }))));
    const lzc_a0 = (lzVar2 ?? (lzVar2 = lzc({
        "a": 0
    })));
    const lzc_b0 = (lzVar3 ?? (lzVar3 = lzc.fn(()=>({
            "b": 0
        }))));
};
export const someAsyncFn = async ()=>{
    const lz_a0 = (lzVar4 ?? (lzVar4 = await lz.async(async ()=>{
        const data = await fetch("https://example.com/lz/a0");
        return data.json();
    }, {}, "uniquekey123")));
    const lzc_a0 = (lzVar5 ?? (lzVar5 = await lzc.async(async ()=>{
        const data = await fetch("https://example.com/lzc/a0");
        return data.json();
    }, {}, "uniquekey123")));
};
