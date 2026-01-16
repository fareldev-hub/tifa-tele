import t from "url-parse";

import { inspect as e } from "util";

import { typePredicates as r } from "ts-type-predicates";

import o from "err-code";

import { _fixReplaceURLProtocol as s } from "replace-url-protocol";

import { messageWithSubErrors as n, errorsToMessageList as a } from "err-indent";

import { errStackMeta as i } from "err-stack-meta";

const h = Symbol("url"), l = Symbol("hidden");

var p;

!function(t) {
  t.protocol = "fake+http:", t.hostname = "url-fake-hostname";
}(p || (p = {}));

const u = findSymbolContext();

class LazyURL extends URL {
  static create(t, e) {
    return new this(t, e);
  }
  constructor(t, e) {
    let r = _core(t, e);
    super(r.url.href), this[l] = r.hidden;
  }
  get paths() {
    return null != u && this[u] && Array.isArray(this[u].path) ? this[u].path.slice() : this.pathname.split("/").filter((t => "" !== t));
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
  toRealString(e) {
    let r = this.fakeEntries();
    if (r.length) {
      let o = t(this.href);
      if (r.forEach((([t, e]) => {
        o[t] === e && o.set(t, "");
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
  set hostname(t) {
    isFakeHostname(t) || delete this[l].hostname, super.hostname = t;
  }
  get href() {
    return super.href;
  }
  set href(t) {
    super.href = t, isFakeProtocol(super.protocol) && (this[l].protocol = "fake+http:"), 
    isFakeHostname(super.hostname) && (this[l].hostname = "url-fake-hostname");
  }
  get origin() {
    let t = super.origin;
    return null != t && "null" !== t && "undefined" !== t || !super.protocol.length || (t = super.protocol + "//" + super.hostname), 
    t;
  }
  get port() {
    return super.port;
  }
  set port(t) {
    var e;
    if ("string" == typeof t && "" !== t) {
      let e = t.toString().trim();
      if (e !== (t = parseInt(t)).toString()) throw new TypeError(`Invalid port input: { '${e}' => ${t} }`);
    }
    if ("number" == typeof t) {
      if (Number.isNaN(t) || !Number.isFinite(t) || t < 0 || t > 65535) throw new RangeError(`Invalid port range: ${t}`);
      t = t.toString();
    }
    super.port = null !== (e = t) && void 0 !== e ? e : "";
  }
  get protocol() {
    return super.protocol;
  }
  set protocol(t) {
    if ("string" != typeof t || t.length < 2 || !t.endsWith(":")) throw new TypeError(`Invalid protocol input: ${t}`);
    isFakeProtocol(t) || delete this[l].protocol;
    const e = super.protocol;
    e !== t && (super.protocol = t, s(this, e, t));
  }
  get auth() {
    var t, e;
    return null !== (t = this.username) && void 0 !== t && t.length ? `${this.username}:${null !== (e = this.password) && void 0 !== e ? e : ""}` : "";
  }
  set auth(t) {
    this.username = "", this.password = "";
    let e = null == t ? void 0 : t.split(":");
    null != e && e.length && (this.username = e.shift(), this.password = e.join(":"));
  }
  get scheme() {
    return this.protocol;
  }
  set scheme(t) {
    this.protocol = t;
  }
  get fragment() {
    return this.hash;
  }
  set fragment(t) {
    this.hash = t;
  }
  get query() {
    return this.search;
  }
  set query(t) {
    this.search = t;
  }
  toObject() {
    return LazyURL.toObject(this);
  }
  static toObject(t) {
    return LazyURL.keys().reduce(((e, r) => (e[r] = "searchParams" === r ? new URLSearchParams(t.searchParams.entries()) : t[r], 
    e)), {});
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
  static values(t) {
    return LazyURL.keys().map((e => t[e]));
  }
  static entries(t) {
    return LazyURL.keys().map((e => [ e, t[e] ]));
  }
  createURLSearchParams(t) {
    return t instanceof URL && (t = t.searchParams), new URLSearchParams(t);
  }
  set(t, e) {
    this[t] = e;
  }
  get(t) {
    return this[t];
  }
}

function findSymbolContext() {
  let t = _newURL("https://localhost");
  return Object.getOwnPropertySymbols(t).filter((e => "localhost" == t[e].host))[0];
}

function _core(o, s) {
  if (Array.isArray(o) && null == s && ([o, s] = o), null != o) if (o instanceof LazyURL) o = o.toRealString(); else if (o instanceof URL) o = o.href; else if ("string" == typeof o.href) {
    var n;
    o = o.href, null !== (n = s) && void 0 !== n || (s = o.baseURI);
  }
  if ("string" != typeof o) throw _wrapError(new TypeError(`Argument '${e(o)}' is not assignable to url like.`), o, s);
  let a;
  const i = {};
  "string" != typeof s && null != s && "string" == typeof s.href && (s = s.href), 
  "" === s && (s = void 0);
  try {
    a = _newURL(o, s);
  } catch (e) {
    let n;
    if (r(e), "ERR_INVALID_URL" === e.code || /Invalid URL/.test(e.message)) if ("string" == typeof s) {
      let e = s, r = t(s);
      "" !== r.host && "" !== r.protocol || (!e.includes("/") && [ r.protocol + r.host, r.protocol + r.pathname ].includes(e.toLowerCase()) && (r = t(""), 
      r.set("host", e), r.set("protocol", "fake+http:"), r.set("pathname", ""), i.protocol = "fake+http:"), 
      "" === r.host && ("" == r.pathname || r.pathname.includes("/") ? (r.set("host", "url-fake-hostname"), 
      i.hostname = r.hostname) : (r.set("host", r.pathname), r.set("pathname", ""))), 
      "" === r.protocol && (r.set("protocol", "fake+http:"), i.protocol = r.protocol), 
      "" === r.pathname || r.pathname.startsWith("/") || r.set("pathname", "/" + r.pathname), 
      a = _newURL(o, r.toString()), n = !0);
    } else (null != o && "" !== o || null != s) && null != o && null == s && (a = _newURL(o, s = "fake+http://url-fake-hostname"), 
    i.protocol = "fake+http:", i.hostname = "url-fake-hostname", n = !0);
    if (!n) throw e;
  }
  return {
    url: a,
    hidden: i
  };
}

function _wrapError(t, e, s, h) {
  var l;
  r(t);
  let p = t.message;
  if ("Invalid URL" === p || "ERR_INVALID_URL" === t.code || h) {
    p = n(t, [ t, {
      input: e,
      baseURL: s
    } ]);
    let r = i(t);
    t.stack = a([ t, {
      input: e,
      baseURL: s
    } ], {}, t).concat([ r.stack ]).join("\n");
  }
  return t.message !== p && (t.message = p), o(t, null !== (l = t.code) && void 0 !== l ? l : "ERR_INVALID_URL", {
    input: e,
    baseURL: s
  });
}

function _newURL(t, e) {
  try {
    return new URL(t, e);
  } catch (r) {
    throw _wrapError(r, t, e);
  }
}

function isFakeProtocol(t) {
  return "fake+http:" === t;
}

function isFakeHostname(t) {
  return "url-fake-hostname" === t;
}

export { p as ENUM_FAKE, LazyURL, l as SYM_HIDDEN, h as SYM_URL, _core, LazyURL as default, findSymbolContext, isFakeHostname, isFakeProtocol };
//# sourceMappingURL=index.esm.mjs.map
