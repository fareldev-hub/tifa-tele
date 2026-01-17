"use strict";

Object.defineProperty(exports, "__esModule", {
  value: !0
});

var e = require("error-stack2");

function errStackMeta(r) {
  let t = e.parseStack(r.stack, r.message);
  return {
    type: t.type,
    prefix: e.formatMessagePrefix(t) + ": ",
    message: t.message,
    rawTrace: t.rawTrace,
    stack: t.rawTrace.join("\n"),
    error: r
  };
}

exports.default = errStackMeta, exports.errStackMeta = errStackMeta, exports.stringifyStackMeta = function stringifyStackMeta(e, r) {
  var t, a;
  return null !== (t = r) && void 0 !== t || (r = e.stack), r.length && (r = `\n${r}`), 
  `${e.prefix}${null !== (a = e.message) && void 0 !== a ? a : ""}${r}`;
};
//# sourceMappingURL=index.cjs.production.min.cjs.map
