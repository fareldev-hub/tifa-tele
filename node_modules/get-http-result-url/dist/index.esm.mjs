import { LazyURL as o } from "lazy-url";

import { LazyURLSearchParams as e } from "http-form-urlencoded";

function resultToURL(o, e, l) {
  var t;
  return requestToURL(null == o ? void 0 : o.request, e, null !== (t = null != l ? l : null == e ? void 0 : e.response) && void 0 !== t ? t : o);
}

function requestToURL(e, l, t) {
  try {
    var r, n, u;
    return new o(null !== (r = null !== (n = e.url) && void 0 !== n ? n : null === (u = e.res) || void 0 === u ? void 0 : u.responseUrl) && void 0 !== r ? r : _requestToURL(e, null != t ? t : null == l ? void 0 : l.response));
  } catch (o) {
    if (null == l || !l.ignoreError) throw o;
  }
}

function _requestToURL(l, t) {
  var r, n, u, s, a, i;
  let d = l._currentUrl, p = null !== (r = null !== (n = l._currentRequest) && void 0 !== n ? n : l) && void 0 !== r ? r : {}, c = null !== (u = l._options) && void 0 !== u ? u : {};
  if (null !== (s = t) && void 0 !== s || (t = {}), null !== (a = c.protocol) && void 0 !== a && a.length) {
    var v, h, f, m, U;
    let e;
    e = new o(c.protocol && c.hostname ? c.protocol + "//" + c.hostname : p.path), e.set("protocol", null !== (v = c.protocol) && void 0 !== v ? v : p.protocol), 
    e.set("port", c.port), e.set("pathname", null !== (h = c.pathname) && void 0 !== h ? h : p.path), 
    e.set("query", c.search), e.set("auth", c.auth), e.set("hostname", null !== (f = null !== (m = c.hostname) && void 0 !== m ? m : null === (U = p.getHeader) || void 0 === U ? void 0 : U.call(p, "Host")) && void 0 !== f ? f : p.host), 
    d = e;
  } else if ("function" == typeof p.getHeader) {
    var R;
    let e = new o(null !== (R = l.protocol + "//" + p.getHeader("Host")) && void 0 !== R ? R : p.host);
    e.pathname = l.path, e.protocol = l.protocol, d = e;
  } else !d && null !== (i = t.config) && void 0 !== i && i.url && (d = new o(t.config.url, t.config.baseURL), 
  void 0 !== t.config.params) && new e(t.config.params).forEach(((o, e) => {
    d.searchParams.set(e, o);
  }));
  return new o(d);
}

export { _requestToURL, requestToURL as default, requestToURL, resultToURL };
//# sourceMappingURL=index.esm.mjs.map
