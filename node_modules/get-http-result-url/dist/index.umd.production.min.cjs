!function(e, o) {
  "object" == typeof exports && "undefined" != typeof module ? o(exports, require("lazy-url"), require("http-form-urlencoded")) : "function" == typeof define && define.amd ? define([ "exports", "lazy-url", "http-form-urlencoded" ], o) : o((e = "undefined" != typeof globalThis ? globalThis : e || self).GetHttpResultUrl = {}, e.lazyUrl, e.httpFormUrlencoded);
}(this, (function(e, o, t) {
  "use strict";
  function requestToURL(e, t, l) {
    try {
      var r, n, u;
      return new o.LazyURL(null !== (r = null !== (n = e.url) && void 0 !== n ? n : null === (u = e.res) || void 0 === u ? void 0 : u.responseUrl) && void 0 !== r ? r : _requestToURL(e, null != l ? l : null == t ? void 0 : t.response));
    } catch (e) {
      if (null == t || !t.ignoreError) throw e;
    }
  }
  function _requestToURL(e, l) {
    var r, n, u, s, a, i;
    let d = e._currentUrl, c = null !== (r = null !== (n = e._currentRequest) && void 0 !== n ? n : e) && void 0 !== r ? r : {}, p = null !== (u = e._options) && void 0 !== u ? u : {};
    if (null !== (s = l) && void 0 !== s || (l = {}), null !== (a = p.protocol) && void 0 !== a && a.length) {
      var f, v, h, L, U;
      let e;
      e = new o.LazyURL(p.protocol && p.hostname ? p.protocol + "//" + p.hostname : c.path), 
      e.set("protocol", null !== (f = p.protocol) && void 0 !== f ? f : c.protocol), e.set("port", p.port), 
      e.set("pathname", null !== (v = p.pathname) && void 0 !== v ? v : c.path), e.set("query", p.search), 
      e.set("auth", p.auth), e.set("hostname", null !== (h = null !== (L = p.hostname) && void 0 !== L ? L : null === (U = c.getHeader) || void 0 === U ? void 0 : U.call(c, "Host")) && void 0 !== h ? h : c.host), 
      d = e;
    } else if ("function" == typeof c.getHeader) {
      var R;
      let t = new o.LazyURL(null !== (R = e.protocol + "//" + c.getHeader("Host")) && void 0 !== R ? R : c.host);
      t.pathname = e.path, t.protocol = e.protocol, d = t;
    } else !d && null !== (i = l.config) && void 0 !== i && i.url && (d = new o.LazyURL(l.config.url, l.config.baseURL), 
    void 0 !== l.config.params) && new t.LazyURLSearchParams(l.config.params).forEach(((e, o) => {
      d.searchParams.set(o, e);
    }));
    return new o.LazyURL(d);
  }
  e._requestToURL = _requestToURL, e.default = requestToURL, e.requestToURL = requestToURL, 
  e.resultToURL = function resultToURL(e, o, t) {
    var l;
    return requestToURL(null == e ? void 0 : e.request, o, null !== (l = null != t ? t : null == o ? void 0 : o.response) && void 0 !== l ? l : e);
  }, Object.defineProperty(e, "__esModule", {
    value: !0
  });
}));
//# sourceMappingURL=index.umd.production.min.cjs.map
