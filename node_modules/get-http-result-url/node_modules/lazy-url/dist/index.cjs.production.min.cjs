"use strict";

Object.defineProperty(exports, "__esModule", {
  value: !0
});

var e = require("url-parse"), t = require("util"), r = require("ts-type-predicates"), s = require("err-code"), o = require("replace-url-protocol"), a = require("err-indent"), n = require("err-stack-meta");

const i = Symbol("url"), l = Symbol("hidden");

var h;

exports.ENUM_FAKE = void 0, (h = exports.ENUM_FAKE || (exports.ENUM_FAKE = {})).protocol = "fake+http:", 
h.hostname = "url-fake-hostname";

const p = findSymbolContext();

class LazyURL extends URL {
  static create(e, t) {
    return new this(e, t);
  }
  constructor(e, t) {
    let r = _core(e, t);
    super(r.url.href), this[l] = r.hidden;
  }
  get paths() {
    return null != p && this[p] && Array.isArray(this[p].path) ? this[p].path.slice() : this.pathname.split("/").filter((e => "" !== e));
  }
  fakeExists() {
    return this.fakeKeys().length;
  }
  fakeKeys() {
    return Object.keys(this[l]);
  }
  fakeEntries() {
    return Object.entries(this[l]);
  }
  toRealString(t) {
    let r = this.fakeEntries();
    if (r.length) {
      let s = e(this.href);
      if (r.forEach((([e, t]) => {
        s[e] === t && s.set(e, "");
      })), "" === s.host) if (null != t && t.ignoreInvalid) s.set("username", ""), s.set("password", ""), 
      s.set("port", ""), s.set("protocol", ""); else if ("" !== s.username || "" !== s.password || "" !== s.port || "" !== s.protocol) throw _wrapError(new TypeError("Invalid URL"), s);
      let o = s.toString(null == t ? void 0 : t.stringify);
      return "" === s.protocol && "" === s.host && (o = o.replace(/^\/\//, "")), o;
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
    isFakeHostname(e) || delete this[l].hostname, super.hostname = e;
  }
  get href() {
    return super.href;
  }
  set href(e) {
    super.href = e, isFakeProtocol(super.protocol) && (this[l].protocol = "fake+http:"), 
    isFakeHostname(super.hostname) && (this[l].hostname = "url-fake-hostname");
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
    isFakeProtocol(e) || delete this[l].protocol;
    const t = super.protocol;
    t !== e && (super.protocol = e, o._fixReplaceURLProtocol(this, t, e));
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

function _core(s, o) {
  if (Array.isArray(s) && null == o && ([s, o] = s), null != s) if (s instanceof LazyURL) s = s.toRealString(); else if (s instanceof URL) s = s.href; else if ("string" == typeof s.href) {
    var a;
    s = s.href, null !== (a = o) && void 0 !== a || (o = s.baseURI);
  }
  if ("string" != typeof s) throw _wrapError(new TypeError(`Argument '${t.inspect(s)}' is not assignable to url like.`), s, o);
  let n;
  const i = {};
  "string" != typeof o && null != o && "string" == typeof o.href && (o = o.href), 
  "" === o && (o = void 0);
  try {
    n = _newURL(s, o);
  } catch (t) {
    let a;
    if (r.typePredicates(t), "ERR_INVALID_URL" === t.code || /Invalid URL/.test(t.message)) if ("string" == typeof o) {
      let t = o, r = e(o);
      "" !== r.host && "" !== r.protocol || (!t.includes("/") && [ r.protocol + r.host, r.protocol + r.pathname ].includes(t.toLowerCase()) && (r = e(""), 
      r.set("host", t), r.set("protocol", "fake+http:"), r.set("pathname", ""), i.protocol = "fake+http:"), 
      "" === r.host && ("" == r.pathname || r.pathname.includes("/") ? (r.set("host", "url-fake-hostname"), 
      i.hostname = r.hostname) : (r.set("host", r.pathname), r.set("pathname", ""))), 
      "" === r.protocol && (r.set("protocol", "fake+http:"), i.protocol = r.protocol), 
      "" === r.pathname || r.pathname.startsWith("/") || r.set("pathname", "/" + r.pathname), 
      n = _newURL(s, r.toString()), a = !0);
    } else (null != s && "" !== s || null != o) && null != s && null == o && (n = _newURL(s, o = "fake+http://url-fake-hostname"), 
    i.protocol = "fake+http:", i.hostname = "url-fake-hostname", a = !0);
    if (!a) throw t;
  }
  return {
    url: n,
    hidden: i
  };
}

function _wrapError(e, t, o, i) {
  var l;
  r.typePredicates(e);
  let h = e.message;
  if ("Invalid URL" === h || "ERR_INVALID_URL" === e.code || i) {
    h = a.messageWithSubErrors(e, [ e, {
      input: t,
      baseURL: o
    } ]);
    let r = n.errStackMeta(e);
    e.stack = a.errorsToMessageList([ e, {
      input: t,
      baseURL: o
    } ], {}, e).concat([ r.stack ]).join("\n");
  }
  return e.message !== h && (e.message = h), s(e, null !== (l = e.code) && void 0 !== l ? l : "ERR_INVALID_URL", {
    input: t,
    baseURL: o
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

exports.LazyURL = LazyURL, exports.SYM_HIDDEN = l, exports.SYM_URL = i, exports._core = _core, 
exports.default = LazyURL, exports.findSymbolContext = findSymbolContext, exports.isFakeHostname = isFakeHostname, 
exports.isFakeProtocol = isFakeProtocol;
//# sourceMappingURL=index.cjs.production.min.cjs.map
