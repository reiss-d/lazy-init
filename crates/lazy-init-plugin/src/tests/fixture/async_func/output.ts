// @ts-nocheck
import { lz, lzc } from "lazy-init";
import { fetchData } from "some-lib";

var lzVar, lzVar1;

export const someAsyncFn = async () => {
   const fetched = (lzVar ?? (lzVar = await lz.async(async () => {
      const data = await fetchData();
      return data.json();
   }, {}, "uniquekey123")));
   return fetched;
};

export const someOtherAsyncFn = async () => {
   return (lzVar1 ?? (lzVar1 = await lzc.async(fetchData, { fallback: { foo: 'bar' }}, "uniquekey123")));
};
