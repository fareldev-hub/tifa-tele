import r from "indent-string";

import e from "clean-stack";

import { inspect as t } from "util";

import { isIterable as n } from "check-iterable";

import { array_unique_overwrite as o } from "array-hyper-unique";

import { getSubErrors as s } from "err-errors";

import { errStackReduceCore as i } from "err-stack-reduce";

import { stringifyStackMeta as l } from "err-stack-meta";

import { parseStack as u } from "error-stack2";

function _isAllowedIterable(r) {
  return "string" != typeof r && !(r instanceof String) && n(r);
}

function errorsToMessageList(r, n, s) {
  var u, a, d;
  if (!r || !_isAllowedIterable(r)) throw new TypeError(`Invalid input errors: ${r}`);
  null !== (u = n) && void 0 !== u || (n = {});
  const {handleStack: m = (r => e(r))} = n;
  let f;
  null !== (a = s) && void 0 !== a || (s = n.error);
  let c = [];
  const g = i(s, n.stackReduceOptions);
  return r.forEach((r => {
    null != r && (s === r ? f = String(r) : c.push("string" == typeof r.stack ? m(l(g(r)), r) : t(r)));
  })), c = c.filter((r => null == r ? void 0 : r.length)), null !== (d = f) && void 0 !== d && d.length && c.unshift(f), 
  o(c);
}

function indentSubErrorMessage(e, t) {
  var n, o;
  return _isAllowedIterable(e) && (e = [ ...e ].join("\n")), null !== (n = t) && void 0 !== n || (t = {}), 
  r(e, null !== (o = t.indent) && void 0 !== o ? o : 4, t.indentOptions);
}

function indentSubErrors(r, e, t) {
  return indentSubErrorMessage(errorsToMessageList(r, e, t), e);
}

function indentSubErrorsFromError(r, e) {
  return indentSubErrors(s(r), e, r);
}

function messageWithSubErrors(r, e, t) {
  var n;
  null !== (n = e) && void 0 !== n || (e = s(r));
  let o = u(r.stack, r.message), i = [];
  void 0 !== o.message && i.push(o.message);
  let l = indentSubErrors(e, t, r);
  if (l.length && (0 === i.length && i.push(""), i.push(l)), i.length) return i.join("\n");
}

export { _isAllowedIterable, messageWithSubErrors as default, errorsToMessageList, indentSubErrorMessage, indentSubErrors, indentSubErrorsFromError, messageWithSubErrors };
//# sourceMappingURL=index.esm.mjs.map
