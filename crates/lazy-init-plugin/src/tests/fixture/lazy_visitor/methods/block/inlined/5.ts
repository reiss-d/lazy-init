// @ts-nocheck
import { lz, block } from "lazy-init";

// input
export const t0 = lz.block(() => {
    try {
        return passed();
    } catch (error) {
        return failed();
    }
});

export const t1 = block(() => {
    try {
        throw new Error("try");
    } catch (error) {
        return failed();
    }
});

export const t2 = lz.block(() => {
    try {
        throw new Error("try");
    } finally {
        return saved();
    }
});

export const t3 = block(() => {
    try {
        return passed();
    } finally {
        return saved();
    }
});

export const t4 = lz.block(() => {
    try {
        return passed();
    } catch (error) {
        return failed();
    } finally {
        return saved();
    }
});

export const t5 = block(() => {
    try {
        return passed();
    } catch (error) {
        throw new Error("catch");
    } finally {
        return saved();
    }
});

export const t6 = lz.block(() => {
    try {
        return passed();
    } catch (error) {
        return failed();
    } finally {
        then();
    }
});

export const t7 = block(() => {
    try {
        return passed();
    } catch (error) {
        throw new Error("catch");
    } finally {
        then();
    }
});

export const t8 = lz.block(() => {
    if (cond) {
        try {
            return passed();
        } catch (error) {
            return failed();
        }
    } else {
        return 1;
    }
});

// output

var lzVar;
try {
    lzVar = passed();
} catch (error) {
    lzVar = failed();
}
export const t0 = lzVar;

var lzVar1;
try {
    throw new Error("try");
} catch (error) {
    lzVar1 = failed();
}
export const t1 = lzVar1;

var lzVar2;
try {
    throw new Error("try");
} finally{
    lzVar2 = saved();
}
export const t2 = lzVar2;

var lzVar3;
try {
    lzVar3 = passed();
} finally{
    lzVar3 = saved();
}
export const t3 = lzVar3;

var lzVar4;
try {
    lzVar4 = passed();
} catch (error) {
    lzVar4 = failed();
} finally{
    lzVar4 = saved();
}
export const t4 = lzVar4;

var lzVar5;
try {
    lzVar5 = passed();
} catch (error) {
    throw new Error("catch");
} finally{
    lzVar5 = saved();
}
export const t5 = lzVar5;

var lzVar6;
try {
    lzVar6 = passed();
} catch (error) {
    lzVar6 = failed();
} finally{
    then();
}
export const t6 = lzVar6;

var lzVar7;
try {
    lzVar7 = passed();
} catch (error) {
    throw new Error("catch");
} finally{
    then();
}
export const t7 = lzVar7;

var lzVar8;
if (cond) {
    try {
        lzVar8 = passed();
    } catch (error) {
        lzVar8 = failed();
    }
} else {
    lzVar8 = 1;
}
export const t8 = lzVar8;

// output.compressed
var lzVar;
try {
    lzVar = passed();
} catch (error) {
    lzVar = failed();
}
export const t0 = lzVar;

var lzVar1;
try {
    throw Error("try");
} catch (error) {
    lzVar1 = failed();
}
export const t1 = lzVar1;

var lzVar2;
try {
    throw Error("try");
} finally{
    lzVar2 = saved();
}
export const t2 = lzVar2;

var lzVar3;
try {
    lzVar3 = passed();
} finally{
    lzVar3 = saved();
}
export const t3 = lzVar3;

var lzVar4;
try {
    lzVar4 = passed();
} catch (error) {
    lzVar4 = failed();
} finally{
    lzVar4 = saved();
}
export const t4 = lzVar4;

var lzVar5;
try {
    lzVar5 = passed();
} catch (error) {
    throw Error("catch");
} finally{
    lzVar5 = saved();
}
export const t5 = lzVar5;

var lzVar6;
try {
    lzVar6 = passed();
} catch (error) {
    lzVar6 = failed();
} finally{
    then();
}
export const t6 = lzVar6;

var lzVar7;
try {
    lzVar7 = passed();
} catch (error) {
    throw Error("catch");
} finally{
    then();
}
export const t7 = lzVar7;

var lzVar8;
if (!cond) {
    lzVar8 = 1;
} else {
    try {
        lzVar8 = passed();
    } catch (error) {
        lzVar8 = failed();
    }
}
export const t8 = lzVar8;
