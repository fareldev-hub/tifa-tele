import { parseStack as e, formatMessagePrefix as r } from "error-stack2";

function errStackMeta(a) {
  let t = e(a.stack, a.message);
  return {
    type: t.type,
    prefix: r(t) + ": ",
    message: t.message,
    rawTrace: t.rawTrace,
    stack: t.rawTrace.join("\n"),
    error: a
  };
}

function stringifyStackMeta(e, r) {
  var a, t;
  return null !== (a = r) && void 0 !== a || (r = e.stack), r.length && (r = `\n${r}`), 
  `${e.prefix}${null !== (t = e.message) && void 0 !== t ? t : ""}${r}`;
}

export { errStackMeta as default, errStackMeta, stringifyStackMeta };
//# sourceMappingURL=index.esm.mjs.map
