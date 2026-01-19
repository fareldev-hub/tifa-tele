"use strict";

function getSubErrors(r) {
  var e, o, l, t;
  return null !== (e = null !== (o = r.errors) && void 0 !== o ? o : null === (l = r[Symbol.iterator]) || void 0 === l ? void 0 : l.call(r)) && void 0 !== e ? e : null === (t = r.slice) || void 0 === t ? void 0 : t.call(r);
}

Object.defineProperty(exports, "__esModule", {
  value: !0
}), exports.default = getSubErrors, exports.getSubErrors = getSubErrors;
//# sourceMappingURL=index.cjs.production.min.cjs.map
