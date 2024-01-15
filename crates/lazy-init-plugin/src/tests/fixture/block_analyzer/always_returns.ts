// @ts-nocheck

function a0() {
   if (cond) {
      return 0;
   } else {
      return 1;
   }
}
function a1() {
   if (cond) {
      return 0;
   }
   return 1;
}
function a2() {
   if (condA) return 0;
   if (condB) return 1;
   return 3;
}

function b0() {
   if (cond) return 0;
   else return 1;
}
function b1() {
   if (cond) return 0;
   return 1;
}

function c0() {
   if (cond) { return 0; }
   else return 1;
}
function c1() {
   if (cond) { return 0; }
   return 1;
}

function d0() {
   if (cond) return 0;
   else { return 1; }
}

function e0() {
   if (cond) { throw new Error("oops"); }
   else { return 1; }
}
function e0() {
   if (cond) { throw new Error("oops"); }
   return 1;
}

function f0() {
   if (A) {
      if (B) {
         return 0;
      } else {
         return 1;
      }
   } else {
      if (C) {
         return 0;
      } else {
         return 1;
      }
   }
}
function f1() {
   if (A) {
      if (B) {
         return 0;
      } else {
         return 1;
      }
   }
   if (C) {
      return 0;
   } else {
      return 1;
   }
}

function g0() {
   switch (val) {
      case A: return 0;
      case B: return 1;
      default: return 2;
   }
}
function g1() {
   switch (val) {
      case A: {
         return 0;
      }
      case B: {
         return 1;
      }
      default: {
         return 2;
      }
   }
}

function h0() {
   switch (val) {
      case A:
      case B: { 
         return 1;
      }
      default: { 
         return 2;
      }
   }
}

function i0() {
   switch (val) {
      case A: { 
         val += A;
         break;
      }
      case B: { 
         val += B;
      }
      default: { 
         val += 10;
      }
   }
   return 0;
}

function j0() {
   try {
      return passed();
   } catch (error) {
      return failed();
   }
}

function j1() {
   try {
      throw new Error("try");
   } catch (error) {
      return failed();
   }
}

function j2() {
   try {
      throw new Error("try");
   } finally {
      return saved();
   }
}

function j3() {
   try {
      return passed();
   } finally {
      return saved();
   }
}

function j4() {
   try {
      return passed();
   } catch (error) {
      return failed();
   } finally {
      return saved();
   }
}

function j5() {
   try {
      return passed();
   } catch (error) {
      throw new Error("catch");
   } finally {
      return saved();
   }
}

function j6() {
   try {
      return passed();
   } catch (error) {
      return failed();
   } finally {
      //
   }
}

function j7() {
   try {
      return passed();
   } catch (error) {
      throw new Error("catch");
   } finally {
      //
   }
}


function k0() {
   if (cond) {
      try {
         return passed();
      } catch (error) {
         return failed();
      }
   } else {
      return 1;
   }
}

function z0() {
   for (let i = 0; i < 5; i++) {
      if (condA) break;
      if (condB) continue;
      i++;
   }
   return 1;
}