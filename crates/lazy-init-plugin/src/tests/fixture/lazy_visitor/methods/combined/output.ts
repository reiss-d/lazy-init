// @ts-nocheck
import { lz, lzc } from "lazy-init";

var lzVar, lzVar1, lzVar2, lzVar3;

export const someFn = () => {
   const a = (lzVar ?? (lzVar = lz({ "a": 1 }, {})));
   const a_c = (lzVar1 ?? (lzVar1 = lzc({ "a": 1 }, {})));
   const b = (lzVar2 ?? (lzVar2 = lz.fn(() => ({ "b": 2 }), {})));
   const b_c = (lzVar3 ?? (lzVar3 = lzc.fn(() => ({ "b": 2 }), {})));
};
