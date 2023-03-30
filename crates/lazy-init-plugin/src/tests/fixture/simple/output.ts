// @ts-nocheck
import { lz } from "lazy-init";

var lzVar, lzVar1;

export const someFn = () => {
   const a = (lzVar ?? (lzVar = lz({ "a": 1 }, {})));
   const b = (lzVar1 ?? (lzVar1 = lz.fn(() => ({ "b": 2 }), {})));
};
