// @ts-nocheck
import { lz } from "lazy-init";

export const someFn = () => {
   const a = lz({ "a": 1 }, {});
   const b = lz.fn(() => ({ "b": 2 }), {});
};
