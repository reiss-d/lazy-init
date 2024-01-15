// @ts-nocheck
import lz from "lazy-init";

export const someFn = () => {
   const lz_a0 = lz({ "a": 0 });
   const lz_b0 = lz.fn(() => ({ "b": 0 }));
};

export const someAsyncFn = async () => {
   const lz_a0 = lz.async(async () => {
      const data = await fetch("https://example.com/lz/a0");
      return data.json();
   }, {});
};
