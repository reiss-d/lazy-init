// @ts-nocheck
import { lz, lzc } from "lazy-init";

export const base = () => {
   const lz_a0 = lz({ "a": 0 });

   const lz_b0 = lz({ "b": 0 }, true);
   const lz_b1 = lz({ "b": 1 }, false);

   const lz_c0 = lz({ "c": 0 }, {});
   const lz_c1 = lz({ "c": 1 }, { cache: true });
   const lz_c2 = lz({ "c": 2 }, { freeze: true });
   const lz_c3 = lz({ "c": 3 }, { cache: true, freeze: true });

   const lzc_a0 = lzc({ "a": 0 });

   const lzc_b0 = lzc({ "b": 0 }, true);
   const lzc_b1 = lzc({ "b": 1 }, false);

   const lzc_c0 = lzc({ "c": 0 }, {});
   const lzc_c1 = lzc({ "c": 1 }, { cache: true });
   const lzc_c2 = lzc({ "c": 2 }, { freeze: true });
   const lzc_c3 = lzc({ "c": 3 }, { cache: true, freeze: true });
};