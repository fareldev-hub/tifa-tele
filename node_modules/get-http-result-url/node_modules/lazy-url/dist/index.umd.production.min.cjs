!function(e, t) {
  "object" == typeof exports && "undefined" != typeof module ? t(exports, require("url-parse"), require("util"), require("ts-type-predicates"), require("err-code"), require("replace-url-protocol"), require("err-indent"), require("err-stack-meta")) : "function" == typeof define && define.amd ? define([ "exports", "url-parse", "util", "ts-type-predicates", "err-code", "replace-url-protocol", "err-indent", "err-stack-meta" ], t) : t((e = "undefined" != typeof globalThis ? globalThis : e || self).LazyUrl = {}, e.urlParse, e.util, e.tsTypePredicates, e.errcode, e.replaceUrlProtocol, e.errIndent, e.errStackMeta);
}(this, (function(e, t, r, o, s, n, a, i) {
  "use strict";
  const l = Symbol("url"), h = Symbol("hidden");
  var u;
  e.ENUM_FAKE = void 0, (u = e.ENUM_FAKE || (e.ENUM_FAKE = {})).protocol = "fake+http:", 
  u.hostname = "url-fake-hostname";
  const p = findSymbolContext();
  class LazyURL extends URL {
    static create(e, t) {
      return new this(e, t);
    }
    constructor(e, t) {
      let r = _core(e, t);
      super(r.url.href), this[h] = r.hidden;
    }
    get paths() {
      return null != p && this[p] && Array.isArray(this[p].path) ? this[p].path.slice() : this.pathname.split("/").filter((e => "" !== e));
    }
    fakeExists() {
      return this.fakeKeys().length;
    }
    fakeKeys() {
      return Object.keys(this[h]);
    }
    fakeEntries() {
      return Object.entries(this[h]);
    }
    toRealString(e) {
      let r = this.fakeEntries();
      if (r.length) {
        let o = t(this.href);
        if (r.forEach((([e, t]) => {
          o[e] === t && o.set(e, "");
        })), "" === o.host) if (null != e && e.ignoreInvalid) o.set("username", ""), o.set("password", ""), 
        o.set("port", ""), o.set("protocol", ""); else if ("" !== o.username || "" !== o.password || "" !== o.port || "" !== o.protocol) throw _wrapError(new TypeError("Invalid URL"), o);
        let s = o.toString(null == e ? void 0 : e.stringify);
        return "" === o.protocol && "" === o.host && (s = s.replace(/^\/\//, "")), s;
      }
      return this.href;
    }
    toString() {
      return this.href;
    }
    get hostname() {
      return super.hostname;
    }
    set hostname(e) {
      isFakeHostname(e) || delete this[h].hostname, super.hostname = e;
    }
    get href() {
      return super.href;
    }
    set href(e) {
      super.href = e, isFakeProtocol(super.protocol) && (this[h].protocol = "fake+http:"), 
      isFakeHostname(super.hostname) && (this[h].hostname = "url-fake-hostname");
    }
    get origin() {
      let e = super.origin;
      return null != e && "null" !== e && "undefined" !== e || !super.protocol.length || (e = super.protocol + "//" + super.hostname), 
      e;
    }
    get port() {
      return super.port;
    }
    set port(e) {
      var t;
      if ("string" == typeof e && "" !== e) {
        let t = e.toString().trim();
        if (t !== (e = parseInt(e)).toString()) throw new TypeError(`Invalid port input: { '${t}' => ${e} }`);
      }
      if ("number" == typeof e) {
        if (Number.isNaN(e) || !Number.isFinite(e) || e < 0 || e > 65535) throw new RangeError(`Invalid port range: ${e}`);
        e = e.toString();
      }
      super.port = null !== (t = e) && void 0 !== t ? t : "";
    }
    get protocol() {
      return super.protocol;
    }
    set protocol(e) {
      if ("string" != typeof e || e.length < 2 || !e.endsWith(":")) throw new TypeError(`Invalid protocol input: ${e}`);
      isFakeProtocol(e) || delete this[h].protocol;
      const t = super.protocol;
      t !== e && (super.protocol = e, n._fixReplaceURLProtocol(this, t, e));
    }
    get auth() {
      var e, t;
      return null !== (e = this.username) && void 0 !== e && e.length ? `${this.username}:${null !== (t = this.password) && void 0 !== t ? t : ""}` : "";
    }
    set auth(e) {
      this.username = "", this.password = "";
      let t = null == e ? void 0 : e.split(":");
      null != t && t.length && (this.username = t.shift(), this.password = t.join(":"));
    }
    get scheme() {
      return this.protocol;
    }
    set scheme(e) {
      this.protocol = e;
    }
    get fragment() {
      return this.hash;
    }
    set fragment(e) {
      this.hash = e;
    }
    get query() {
      return this.search;
    }
    set query(e) {
      this.search = e;
    }
    toObject() {
      return LazyURL.toObject(this);
    }
    static toObject(e) {
      return LazyURL.keys().reduce(((t, r) => (t[r] = "searchParams" === r ? new URLSearchParams(e.searchParams.entries()) : e[r], 
      t)), {});
    }
    keys() {
      return LazyURL.keys();
    }
    values() {
      return LazyURL.values(this);
    }
    entries() {
      return LazyURL.entries(this);
    }
    static keys() {
      return [ "href", "protocol", "username", "password", "host", "hostname", "port", "pathname", "search", "searchParams", "hash" ];
    }
    static values(e) {
      return LazyURL.keys().map((t => e[t]));
    }
    static entries(e) {
      return LazyURL.keys().map((t => [ t, e[t] ]));
    }
    createURLSearchParams(e) {
      return e instanceof URL && (e = e.searchParams), new URLSearchParams(e);
    }
    set(e, t) {
      this[e] = t;
    }
    get(e) {
      return this[e];
    }
  }
  function findSymbolContext() {
    let e = _newURL("https://localhost");
    return Object.getOwnPropertySymbols(e).filter((t => "localhost" == e[t].host))[0];
  }
  function _core(e, s) {
    if (Array.isArray(e) && null == s && ([e, s] = e), null != e) if (e instanceof LazyURL) e = e.toRealString(); else if (e instanceof URL) e = e.href; else if ("string" == typeof e.href) {
      var n;
      e = e.href, null !== (n = s) && void 0 !== n || (s = e.baseURI);
    }
    if ("string" != typeof e) throw _wrapError(new TypeError(`Argument '${r.inspect(e)}' is not assignable to url like.`), e, s);
    let a;
    const i = {};
    "string" != typeof s && null != s && "string" == typeof s.href && (s = s.href), 
    "" === s && (s = void 0);
    try {
      a = _newURL(e, s);
    } catch (r) {
      let n;
      if (o.typePredicates(r), "ERR_INVALID_URL" === r.code || /Invalid URL/.test(r.message)) if ("string" == typeof s) {
        let r = s, o = t(s);
        "" !== o.host && "" !== o.protocol || (!r.includes("/") && [ o.protocol + o.host, o.protocol + o.pathname ].includes(r.toLowerCase()) && (o = t(""), 
        o.set("host", r), o.set("protocol", "fake+http:"), o.set("pathname", ""), i.protocol = "fake+http:"), 
        "" === o.host && ("" == o.pathname || o.pathname.includes("/") ? (o.set("host", "url-fake-hostname"), 
        i.hostname = o.hostname) : (o.set("host", o.pathname), o.set("pathname", ""))), 
        "" === o.protocol && (o.set("protocol", "fake+http:"), i.protocol = o.protocol), 
        "" === o.pathname || o.pathname.startsWith("/") || o.set("pathname", "/" + o.pathname), 
        a = _newURL(e, o.toString()), n = !0);
      } else (null != e && "" !== e || null != s) && null != e && null == s && (a = _newURL(e, s = "fake+http://url-fake-hostname"), 
      i.protocol = "fake+http:", i.hostname = "url-fake-hostname", n = !0);
      if (!n) throw r;
    }
    return {
      url: a,
      hidden: i
    };
  }
  function _wrapError(e, t, r, n) {
    var l;
    o.typePredicates(e);
    let h = e.message;
    if ("Invalid URL" === h || "ERR_INVALID_URL" === e.code || n) {
      h = a.messageWithSubErrors(e, [ e, {
        input: t,
        baseURL: r
      } ]);
      let o = i.errStackMeta(e);
      e.stack = a.errorsToMessageList([ e, {
        input: t,
        baseURL: r
      } ], {}, e).concat([ o.stack ]).join("\n");
    }
    return e.message !== h && (e.message = h), s(e, null !== (l = e.code) && void 0 !== l ? l : "ERR_INVALID_URL", {
      input: t,
      baseURL: r
    });
  }
  function _newURL(e, t) {
    try {
      return new URL(e, t);
    } catch (r) {
      throw _wrapError(r, e, t);
    }
  }
  function isFakeProtocol(e) {
    return "fake+http:" === e;
  }
  function isFakeHostname(e) {
    return "url-fake-hostname" === e;
  }
  e.LazyURL = LazyURL, e.SYM_HIDDEN = h, e.SYM_URL = l, e._core = _core, e.default = LazyURL, 
  e.findSymbolContext = findSymbolContext, e.isFakeHostname = isFakeHostname, e.isFakeProtocol = isFakeProtocol, 
  Object.defineProperty(e, "__esModule", {
    value: !0
  });
}));
//# sourceMappingURL=index.umd.production.min.cjs.map
