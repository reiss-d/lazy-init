// @ts-nocheck
import { lz, lazyAsync } from "lazy-init";
import { fetchData } from "some-lib";

export const someAsyncFn = async () => {
   const fetched = lz.async(async () => {
      const data = await fetchData();
      return data.json();
   }, {});
   return fetched;
};

export const someOtherAsyncFn = async () => {
   return lazyAsync(fetchData, { fallback: { foo: 'bar' }});
};
