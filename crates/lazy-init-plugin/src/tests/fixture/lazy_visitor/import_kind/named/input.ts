// @ts-nocheck
import { lz, lzc } from "lazy-init";

export const someFn = () => {
   const lz_a0 = lz({ "a": 0 });
   const lz_b0 = lz.fn(() => ({ "b": 0 }));

   const lzc_a0 = lzc({ "a": 0 });
   const lzc_b0 = lzc.fn(() => ({ "b": 0 }));
};

export const someAsyncFn = async () => {
   const lz_a0 = lz.async(async () => {
      const data = await fetch("https://example.com/lz/a0");
      return data.json();
   }, {});

   const lzc_a0 = lzc.async(async () => {
      const data = await fetch("https://example.com/lzc/a0");
      return data.json();
   }, {});
};
