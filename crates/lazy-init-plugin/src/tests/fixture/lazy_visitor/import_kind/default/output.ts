// @ts-nocheck
import lz from "lazy-init";

var lzVar, lzVar1, lzVar2;

export const someFn = () => {
   const lz_a0 = (lzVar ?? (lzVar = lz({ "a": 0 })));
   const lz_b0 = (lzVar1 ?? (lzVar1 = lz.fn(() => ({ "b": 0 }))));
};

export const someAsyncFn = async () => {
   const lz_a0 = (lzVar2 ?? (lzVar2 = await lz.async(async () => {
      const data = await fetch("https://example.com/lz/a0");
      return data.json();
   }, {}, "uniquekey123")));
};
