"use strict";

var e = require("err-stack-meta");

function errStackReduceCore(r, t) {
  const c = e.errStackMeta(r).stack, {start: a = 1, end: u = 5} = null != t ? t : {};
  return (r, t) => {
    var d, o;
    let l = e.errStackMeta(r), n = l.stack.split("\n"), i = null !== (d = null == t ? void 0 : t.start) && void 0 !== d ? d : a, k = null !== (o = null == t ? void 0 : t.end) && void 0 !== o ? o : u, s = i;
    do {
      var S;
      if (null !== (S = n[s]) && void 0 !== S && S.length && c.includes(n[s].trim())) {
        n = n.slice(0, s);
        break;
      }
    } while (s++ < k || s >= n.length);
    return {
      ...l,
      stack: n.join("\n"),
      originalStack: l.stack
    };
  };
}

Object.defineProperty(errStackReduceCore, "__esModule", {
  value: !0
}), Object.defineProperty(errStackReduceCore, "errStackReduceCore", {
  value: errStackReduceCore
}), Object.defineProperty(errStackReduceCore, "default", {
  value: errStackReduceCore
}), Object.defineProperty(errStackReduceCore, "errStackReduce", {
  value: function errStackReduce(e, r, t) {
    return errStackReduceCore(r, t)(e);
  }
}), module.exports = errStackReduceCore;
//# sourceMappingURL=index.cjs.production.min.cjs.map
