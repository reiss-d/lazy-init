// @ts-nocheck
import { lz, lzc } from "lazy-init";

export const someFn = () => {
   const a = lz({ "a": 1 }, {});
   const a_c = lzc({ "a": 1 }, {});
   const b = lz.fn(() => ({ "b": 2 }), {});
   const b_c = lzc.fn(() => ({ "b": 2 }), {});
};
