"use strict";

Object.defineProperty(exports, "__esModule", {
  value: !0
});

var e = require("lazy-url"), o = require("http-form-urlencoded");

function requestToURL(o, r, t) {
  try {
    var l, n, u;
    return new e.LazyURL(null !== (l = null !== (n = o.url) && void 0 !== n ? n : null === (u = o.res) || void 0 === u ? void 0 : u.responseUrl) && void 0 !== l ? l : _requestToURL(o, null != t ? t : null == r ? void 0 : r.response));
  } catch (e) {
    if (null == r || !r.ignoreError) throw e;
  }
}

function _requestToURL(r, t) {
  var l, n, u, s, a, i;
  let p = r._currentUrl, c = null !== (l = null !== (n = r._currentRequest) && void 0 !== n ? n : r) && void 0 !== l ? l : {}, d = null !== (u = r._options) && void 0 !== u ? u : {};
  if (null !== (s = t) && void 0 !== s || (t = {}), null !== (a = d.protocol) && void 0 !== a && a.length) {
    var v, L, h, U, R;
    let o;
    o = new e.LazyURL(d.protocol && d.hostname ? d.protocol + "//" + d.hostname : c.path), 
    o.set("protocol", null !== (v = d.protocol) && void 0 !== v ? v : c.protocol), o.set("port", d.port), 
    o.set("pathname", null !== (L = d.pathname) && void 0 !== L ? L : c.path), o.set("query", d.search), 
    o.set("auth", d.auth), o.set("hostname", null !== (h = null !== (U = d.hostname) && void 0 !== U ? U : null === (R = c.getHeader) || void 0 === R ? void 0 : R.call(c, "Host")) && void 0 !== h ? h : c.host), 
    p = o;
  } else if ("function" == typeof c.getHeader) {
    var f;
    let o = new e.LazyURL(null !== (f = r.protocol + "//" + c.getHeader("Host")) && void 0 !== f ? f : c.host);
    o.pathname = r.path, o.protocol = r.protocol, p = o;
  } else !p && null !== (i = t.config) && void 0 !== i && i.url && (p = new e.LazyURL(t.config.url, t.config.baseURL), 
  void 0 !== t.config.params) && new o.LazyURLSearchParams(t.config.params).forEach(((e, o) => {
    p.searchParams.set(o, e);
  }));
  return new e.LazyURL(p);
}

exports._requestToURL = _requestToURL, exports.default = requestToURL, exports.requestToURL = requestToURL, 
exports.resultToURL = function resultToURL(e, o, r) {
  var t;
  return requestToURL(null == e ? void 0 : e.request, o, null !== (t = null != r ? r : null == o ? void 0 : o.response) && void 0 !== t ? t : e);
};
//# sourceMappingURL=index.cjs.production.min.cjs.map
