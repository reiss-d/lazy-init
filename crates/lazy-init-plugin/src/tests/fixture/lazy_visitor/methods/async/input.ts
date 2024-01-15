// @ts-nocheck
import { lz, lzc } from "lazy-init";
import { fetchData } from "some-lib";

export const someAsyncFn = async () => {
   const lz_a0 = lz.async(async () => {
      const data = await fetchData();
      return data.json();
   }, {});
   const lz_a1 = lz.async(async function () {
      const data = await fetchData();
      return data.json();
   }, {});
   const lz_a2 = lz.async(async function named() {
      const data = await fetchData();
      return data.json();
   }, {});
   const lz_a3 = lz.async(async () => {
      const data = await fetchData();
      return data.json();
   });

   const lzc_a0 = lzc.async(async () => {
      const data = await fetchData();
      return data.json();
   }, {});
   const lzc_a1 = lzc.async(async function () {
      const data = await fetchData();
      return data.json();
   }, {});
   const lzc_a2 = lzc.async(async function named() {
      const data = await fetchData();
      return data.json();
   }, {});
   const lzc_a3 = lzc.async(async () => {
      const data = await fetchData();
      return data.json();
   });
};

export const oneLinerAsyncFn = async () => {
   return lz.async(fetchData, { fallback: { foo: "lz" }});
};

export const nestedAsyncFn = async () => {
   return lz.async(async () => {
      const data = lz.async(async () => {
         const _data = await fetchData();
         return _data.json();
      }, {});
      return data;
   }, {});
};
