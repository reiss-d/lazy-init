// @ts-nocheck
import { lz, lzc } from "lazy-init";
import { fetchData } from "some-lib";

var lzVar, lzVar1, lzVar2, lzVar3, lzVar4, lzVar5, lzVar6, lzVar7, lzVar8, lzVar9, lzVar10;

export const someAsyncFn = async ()=>{
    const lz_a0 = (lzVar ?? (lzVar = await lz.async(async ()=>{
        const data = await fetchData();
        return data.json();
    }, {}, "uniquekey123")));
    const lz_a1 = (lzVar1 ?? (lzVar1 = await lz.async(async function() {
        const data = await fetchData();
        return data.json();
    }, {}, "uniquekey123")));
    const lz_a2 = (lzVar2 ?? (lzVar2 = await lz.async(async function named() {
        const data = await fetchData();
        return data.json();
    }, {}, "uniquekey123")));
    const lz_a3 = (lzVar3 ?? (lzVar3 = await lz.async(async ()=>{
        const data = await fetchData();
        return data.json();
    }, void 0, "uniquekey123")));

    const lzc_a0 = (lzVar4 ?? (lzVar4 = await lzc.async(async ()=>{
        const data = await fetchData();
        return data.json();
    }, {}, "uniquekey123")));
    const lzc_a1 = (lzVar5 ?? (lzVar5 = await lzc.async(async function() {
        const data = await fetchData();
        return data.json();
    }, {}, "uniquekey123")));
    const lzc_a2 = (lzVar6 ?? (lzVar6 = await lzc.async(async function named() {
        const data = await fetchData();
        return data.json();
    }, {}, "uniquekey123")));
    const lzc_a3 = (lzVar7 ?? (lzVar7 = await lzc.async(async () => {
        const data = await fetchData();
        return data.json();
    }, void 0, "uniquekey123")));
};

export const oneLinerAsyncFn = async ()=>{
    return (lzVar8 ?? (lzVar8 = await lz.async(fetchData, {
        fallback: {
            foo: "lz"
        }
    }, "uniquekey123")));
};

export const nestedAsyncFn = async ()=>{
    return (lzVar10 ?? (lzVar10 = await lz.async(async ()=>{
        const data = (lzVar9 ?? (lzVar9 = await lz.async(async ()=>{
            const _data = await fetchData();
            return _data.json();
        }, {}, "uniquekey123")));
        return data;
    }, {}, "uniquekey123")));
};
