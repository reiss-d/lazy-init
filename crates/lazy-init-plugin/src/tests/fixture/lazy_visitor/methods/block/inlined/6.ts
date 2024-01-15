// @ts-nocheck
import { lz, block } from "lazy-init";

// input
export const t0 = lz.block(() => {
    for (let i = 0; i < 5; i++) {
        if (condA) break;
        if (condB) continue;
        i++;
    }
    return 1;
});

// output
var lzVar;
for(let i = 0; i < 5; i++){
    if (condA) {
        break;
    }
    if (condB) {
        continue;
    }
    i++;
}
lzVar = 1;
export const t0 = lzVar;

// output.compressed
var lzVar;
for(let i = 0; i < 5 && !condA; i++){
    !condB && i++;
}
lzVar = 1;
export const t0 = lzVar;
