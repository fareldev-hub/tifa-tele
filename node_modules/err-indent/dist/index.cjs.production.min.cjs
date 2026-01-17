"use strict";

Object.defineProperty(exports, "__esModule", {
  value: !0
});

var r = require("indent-string"), e = require("clean-stack"), t = require("util"), s = require("check-iterable"), n = require("array-hyper-unique"), i = require("err-errors"), o = require("err-stack-reduce"), u = require("err-stack-meta"), a = require("error-stack2");

function _isAllowedIterable(r) {
  return "string" != typeof r && !(r instanceof String) && s.isIterable(r);
}

function errorsToMessageList(r, s, i) {
  var a, l, d;
  if (!r || !_isAllowedIterable(r)) throw new TypeError(`Invalid input errors: ${r}`);
  null !== (a = s) && void 0 !== a || (s = {});
  const {handleStack: c = (r => e(r))} = s;
  let g;
  null !== (l = i) && void 0 !== l || (i = s.error);
  let b = [];
  const S = o.errStackReduceCore(i, s.stackReduceOptions);
  return r.forEach((r => {
    null != r && (i === r ? g = String(r) : b.push("string" == typeof r.stack ? c(u.stringifyStackMeta(S(r)), r) : t.inspect(r)));
  })), b = b.filter((r => null == r ? void 0 : r.length)), null !== (d = g) && void 0 !== d && d.length && b.unshift(g), 
  n.array_unique_overwrite(b);
}

function indentSubErrorMessage(e, t) {
  var s, n;
  return _isAllowedIterable(e) && (e = [ ...e ].join("\n")), null !== (s = t) && void 0 !== s || (t = {}), 
  r(e, null !== (n = t.indent) && void 0 !== n ? n : 4, t.indentOptions);
}

function indentSubErrors(r, e, t) {
  return indentSubErrorMessage(errorsToMessageList(r, e, t), e);
}

function messageWithSubErrors(r, e, t) {
  var s;
  null !== (s = e) && void 0 !== s || (e = i.getSubErrors(r));
  let n = a.parseStack(r.stack, r.message), o = [];
  void 0 !== n.message && o.push(n.message);
  let u = indentSubErrors(e, t, r);
  if (u.length && (0 === o.length && o.push(""), o.push(u)), o.length) return o.join("\n");
}

exports._isAllowedIterable = _isAllowedIterable, exports.default = messageWithSubErrors, 
exports.errorsToMessageList = errorsToMessageList, exports.indentSubErrorMessage = indentSubErrorMessage, 
exports.indentSubErrors = indentSubErrors, exports.indentSubErrorsFromError = function indentSubErrorsFromError(r, e) {
  return indentSubErrors(i.getSubErrors(r), e, r);
}, exports.messageWithSubErrors = messageWithSubErrors;
//# sourceMappingURL=index.cjs.production.min.cjs.map
