// @ts-nocheck

function a0() {
   if (cond) return 0;
}

function a1() {
   if (condA) return 0;
   if (condB) return 1;
}

function b0() {
   if (condA) {
      if (condB) {
         return passedB();
      }
   }
   return failedA();
}

function c0() {
   if (condA) { throw new Error("oopsA"); }
   if (condB) { return 1; }
}

function g0() {
   switch (val) {
      case A: return 0;
      case B: return 1;
   }
   return 0;
}

function h0() {
   switch (val) {
      case A: break;
      case B: return 1;
      default: return 2;
   }
   return 0;
}

function j0() {
   try {
      //
   } catch (error) {
      return passed();
      //
   } finally {
      //
   }
}

function j1() {
   try {
      return passed();
   } catch (error) {
      //
   } finally {
      //
   }
}

function j2() {
   try {
      //
   } catch (error) {
      return failed();
   } finally {
      //
   }
}

function j3() {
   try {
      return passed();
   } catch (error) {
      //
   }
}

function j4() {
   try {
      //
   } catch (error) {
      return failed();
   }
}


function k0() {
   if (cond) {
      try {
         //
      } catch (error) {
         return failed();
      }
   } else {
      return 1;
   }
}

function z0() {
   for (let i = 0; i < 5; i++) {
      if (cond) break;
      return 0;
   }
   return 1;
}