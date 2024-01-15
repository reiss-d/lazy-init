// $$ Note that despite the use of a label, this is still an inline transformation.
// $$ The label here is not a wrapper for the block, instead it's used to break
// $$ out of the nested switch statement.
// @ts-nocheck
import { lz, block } from "lazy-init";

// input
export const t0 = lz.block(() => {
    switch (outer) {
        case 0: {
            return "outer-0";
        }
        case 1: {
            switch (inner) {
                case 0: {
                    return "inner-0";
                }
                case 1: {
                    return "inner-1";
                }
                default: {
                    return "inner-default";
                }
            }
        }
        default: {
            return "outer-default";
        }
    }
});

// output
var lzVar;
Block: switch(outer){
    case 0:
        {
            lzVar = "outer-0";
            break;
        }
    case 1:
        {
            switch(inner){
                case 0:
                    {
                        lzVar = "inner-0";
                        break Block;
                    }
                case 1:
                    {
                        lzVar = "inner-1";
                        break Block;
                    }
                default:
                    {
                        lzVar = "inner-default";
                        break Block;
                    }
            }
        }
    default:
        {
            lzVar = "outer-default";
            break;
        }
}
export const t0 = lzVar;

// output.compressed
var lzVar;
Block: switch(outer){
    case 0:
        lzVar = "outer-0";
        break;
    case 1:
        switch(inner){
            case 0:
                lzVar = "inner-0";
                break Block;
            case 1:
                lzVar = "inner-1";
                break Block;
            default:
                lzVar = "inner-default";
                break Block;
        }
    default:
        lzVar = "outer-default";
        break;
}
export const t0 = lzVar;
