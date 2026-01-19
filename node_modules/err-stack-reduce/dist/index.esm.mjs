import { errStackMeta as e } from "err-stack-meta";

function errStackReduceCore(r, t) {
  const c = e(r).stack, {start: n = 1, end: a = 5} = null != t ? t : {};
  return (r, t) => {
    var l, u;
    let o = e(r), i = o.stack.split("\n"), d = null !== (l = null == t ? void 0 : t.start) && void 0 !== l ? l : n, k = null !== (u = null == t ? void 0 : t.end) && void 0 !== u ? u : a, s = d;
    do {
      var v;
      if (null !== (v = i[s]) && void 0 !== v && v.length && c.includes(i[s].trim())) {
        i = i.slice(0, s);
        break;
      }
    } while (s++ < k || s >= i.length);
    return {
      ...o,
      stack: i.join("\n"),
      originalStack: o.stack
    };
  };
}

function errStackReduce(e, r, t) {
  return errStackReduceCore(r, t)(e);
}

export { errStackReduceCore as default, errStackReduce, errStackReduceCore };
//# sourceMappingURL=index.esm.mjs.map
