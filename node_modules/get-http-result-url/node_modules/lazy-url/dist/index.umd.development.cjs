(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('url-parse'), require('util'), require('ts-type-predicates'), require('err-code'), require('replace-url-protocol'), require('err-indent'), require('err-stack-meta')) :
	typeof define === 'function' && define.amd ? define(['exports', 'url-parse', 'util', 'ts-type-predicates', 'err-code', 'replace-url-protocol', 'err-indent', 'err-stack-meta'], factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.LazyUrl = {}, global.urlParse, global.util, global.tsTypePredicates, global.errcode, global.replaceUrlProtocol, global.errIndent, global.errStackMeta));
})(this, (function (exports, urlParse, util, tsTypePredicates, errcode, replaceUrlProtocol, errIndent, errStackMeta) { 'use strict';

	const SYM_URL = /*#__PURE__*/Symbol('url');
	const SYM_HIDDEN = /*#__PURE__*/Symbol('hidden');
	exports.ENUM_FAKE = void 0;
	(function (ENUM_FAKE) {
	  ENUM_FAKE["protocol"] = "fake+http:";
	  ENUM_FAKE["hostname"] = "url-fake-hostname";
	})(exports.ENUM_FAKE || (exports.ENUM_FAKE = {}));
	const SymbolContext = /*#__PURE__*/findSymbolContext();
	class LazyURL extends URL {
	  /**
	   * @deprecated
	   */

	  static create(url, base) {
	    return new this(url, base);
	  }
	  constructor(url, base) {
	    let u = _core(url, base);
	    super(u.url.href);
	    this[SYM_HIDDEN] = u.hidden;
	  }
	  get paths() {
	    if (SymbolContext != null && this[SymbolContext] && Array.isArray(this[SymbolContext].path)) {
	      return this[SymbolContext].path.slice();
	    }
	    return this.pathname.split('/').filter(v => v !== '');
	  }
	  fakeExists() {
	    return this.fakeKeys().length;
	  }
	  fakeKeys() {
	    return Object.keys(this[SYM_HIDDEN]);
	  }
	  fakeEntries() {
	    return Object.entries(this[SYM_HIDDEN]);
	  }
	  /**
	   * get the real url (remove fake value)
	   * throw error if not a valid url
	   *
	   * @returns {string}
	   */
	  toRealString(options) {
	    let ks = this.fakeEntries();
	    if (ks.length) {
	      let u = urlParse(this.href);
	      ks.forEach(([name, value]) => {
	        if (u[name] === value) {
	          u.set(name, '');
	        }
	      });
	      if (u.host === '') {
	        if (options !== null && options !== void 0 && options.ignoreInvalid) {
	          u.set('username', '');
	          u.set('password', '');
	          u.set('port', '');
	          u.set('protocol', '');
	        } else if (u.username !== '' || u.password !== '' || u.port !== '' || u.protocol !== '') {
	          throw _wrapError(new TypeError(`Invalid URL`), u);
	        }
	      }
	      let s = u.toString(options === null || options === void 0 ? void 0 : options.stringify);
	      if (u.protocol === '' && u.host === '') {
	        s = s.replace(/^\/\//, '');
	      }
	      return s;
	    }
	    return this.href;
	  }
	  toString() {
	    return this.href;
	  }
	  get hostname() {
	    return super.hostname;
	  }
	  set hostname(value) {
	    if (!isFakeHostname(value)) {
	      delete this[SYM_HIDDEN].hostname;
	    }
	    super.hostname = value;
	  }
	  get href() {
	    return super.href;
	  }
	  set href(value) {
	    super.href = value;
	    if (isFakeProtocol(super.protocol)) {
	      this[SYM_HIDDEN].protocol = "fake+http:" /* ENUM_FAKE.protocol */;
	    }

	    if (isFakeHostname(super.hostname)) {
	      this[SYM_HIDDEN].hostname = "url-fake-hostname" /* ENUM_FAKE.hostname */;
	    }
	  }

	  get origin() {
	    let origin = super.origin;
	    if ((typeof origin === 'undefined' || origin === null || origin === 'null' || origin === 'undefined') && super.protocol.length) {
	      /**
	       * @see https://github.com/nodejs/node/issues/39732#issuecomment-896624653
	       */
	      origin = super.protocol + '//' + super.hostname;
	    }
	    return origin;
	  }
	  get port() {
	    return super.port;
	  }
	  set port(value) {
	    var _value;
	    if (typeof value === 'string' && value !== '') {
	      let old = value.toString().trim();
	      value = parseInt(value);
	      if (old !== value.toString()) {
	        throw new TypeError(`Invalid port input: { '${old}' => ${value} }`);
	      }
	    }
	    if (typeof value === 'number') {
	      if (Number.isNaN(value) || !Number.isFinite(value) || value < 0 || value > 65535) {
	        throw new RangeError(`Invalid port range: ${value}`);
	      }
	      value = value.toString();
	    }
	    super.port = (_value = value) !== null && _value !== void 0 ? _value : '';
	  }
	  get protocol() {
	    return super.protocol;
	  }
	  set protocol(value) {
	    if (typeof value !== 'string' || value.length < 2 || !value.endsWith(':')) {
	      throw new TypeError(`Invalid protocol input: ${value}`);
	    }
	    if (!isFakeProtocol(value)) {
	      delete this[SYM_HIDDEN].protocol;
	    }
	    const old = super.protocol;
	    if (old !== value) {
	      super.protocol = value;
	      replaceUrlProtocol._fixReplaceURLProtocol(this, old, value);
	    }
	  }
	  get auth() {
	    var _this$username;
	    if ((_this$username = this.username) !== null && _this$username !== void 0 && _this$username.length) {
	      var _this$password;
	      return `${this.username}:${(_this$password = this.password) !== null && _this$password !== void 0 ? _this$password : ''}`;
	    }
	    return '';
	  }
	  set auth(value) {
	    this.username = '';
	    this.password = '';
	    let ls = value === null || value === void 0 ? void 0 : value.split(':');
	    if (ls !== null && ls !== void 0 && ls.length) {
	      this.username = ls.shift();
	      this.password = ls.join(':');
	    }
	  }
	  /**
	   * @alias protocol
	   */
	  get scheme() {
	    return this.protocol;
	  }
	  /**
	   * @alias protocol
	   */
	  set scheme(value) {
	    this.protocol = value;
	  }
	  /**
	   * @alias hash
	   */
	  get fragment() {
	    return this.hash;
	  }
	  /**
	   * @alias hash
	   */
	  set fragment(value) {
	    this.hash = value;
	  }
	  /**
	   * @alias search
	   */
	  get query() {
	    return this.search;
	  }
	  /**
	   * @alias search
	   */
	  set query(value) {
	    this.search = value;
	  }
	  toObject() {
	    return LazyURL.toObject(this);
	  }
	  /**
	   * clone into a object
	   *
	   * @returns {IURLObject}
	   */
	  static toObject(url) {
	    return LazyURL.keys().reduce((a, b) => {
	      if (b === 'searchParams') {
	        a[b] = new URLSearchParams(url.searchParams.entries());
	      } else {
	        a[b] = url[b];
	      }
	      return a;
	    }, {});
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
	    return ['href', 'protocol', 'username', 'password', 'host', 'hostname', 'port', 'pathname', 'search', 'searchParams', 'hash'];
	  }
	  static values(url) {
	    return LazyURL.keys().map(name => url[name]);
	  }
	  static entries(url) {
	    return LazyURL.keys().map(name => [name, url[name]]);
	  }
	  createURLSearchParams(init) {
	    if (init instanceof URL) {
	      init = init.searchParams;
	    }
	    return new URLSearchParams(init);
	  }
	  set(part, value) {
	    this[part] = value;
	  }
	  get(part) {
	    return this[part];
	  }
	}
	function findSymbolContext() {
	  let u = _newURL(`https://localhost`);
	  const SymbolContext = Object.getOwnPropertySymbols(u).filter(sym => u[sym].host == 'localhost')[0];
	  return SymbolContext;
	}
	/**
	 * @private
	 */
	function _core(url, base) {
	  if (Array.isArray(url)) {
	    if (base == null) {
	      [url, base] = url;
	    }
	  }
	  if (typeof url !== 'undefined' && url !== null) {
	    if (url instanceof LazyURL) {
	      url = url.toRealString();
	    } else if (url instanceof URL) {
	      url = url.href;
	    } else if (typeof url.href === 'string') {
	      var _base;
	      url = url.href;
	      (_base = base) !== null && _base !== void 0 ? _base : base = url.baseURI;
	    }
	  }
	  if (typeof url !== 'string') {
	    throw _wrapError(new TypeError(`Argument '${util.inspect(url)}' is not assignable to url like.`), url, base);
	  }
	  let _url;
	  const _hidden_ = {};
	  if (typeof base !== 'string' && base != null && typeof base.href === 'string') {
	    base = base.href;
	  }
	  if (base === '') {
	    base = void 0;
	  }
	  try {
	    _url = _newURL(url, base);
	  } catch (e) {
	    let ok;
	    tsTypePredicates.typePredicates(e);
	    if (e.code === 'ERR_INVALID_URL' || /Invalid URL/.test(e.message)) {
	      if (typeof base === 'string') {
	        let old = base;
	        let u = urlParse(base);
	        if (u.host === '' || u.protocol === '') {
	          if (!old.includes('/') && [u.protocol + u.host, u.protocol + u.pathname].includes(old.toLowerCase())) {
	            u = urlParse('');
	            u.set('host', old);
	            u.set('protocol', "fake+http:" /* ENUM_FAKE.protocol */);
	            u.set('pathname', '');
	            _hidden_.protocol = "fake+http:" /* ENUM_FAKE.protocol */;
	          }

	          if (u.host === '') {
	            if (u.pathname != '' && !u.pathname.includes('/')) {
	              u.set('host', u.pathname);
	              u.set('pathname', '');
	            } else {
	              u.set('host', "url-fake-hostname" /* ENUM_FAKE.hostname */);
	              _hidden_.hostname = u.hostname;
	            }
	          }
	          if (u.protocol === '') {
	            u.set('protocol', "fake+http:" /* ENUM_FAKE.protocol */);
	            _hidden_.protocol = u.protocol;
	          }
	          // @ts-ignore
	          if (u.pathname !== '' && !u.pathname.startsWith('/')) {
	            // @ts-ignore
	            u.set('pathname', '/' + u.pathname);
	          }
	          _url = _newURL(url, u.toString());
	          ok = true;
	        }
	      } else if ((url == null || url === '') && base == null) ; else if (url != null && base == null) {
	        base = `${"fake+http:" /* ENUM_FAKE.protocol */}//${"url-fake-hostname" /* ENUM_FAKE.hostname */}`;
	        _url = _newURL(url, base);
	        _hidden_.protocol = "fake+http:" /* ENUM_FAKE.protocol */;
	        _hidden_.hostname = "url-fake-hostname" /* ENUM_FAKE.hostname */;
	        ok = true;
	      }
	    }
	    if (!ok) {
	      throw e;
	    }
	  }
	  return {
	    url: _url,
	    hidden: _hidden_
	  };
	}
	function _wrapError(e, input, baseURL, errInvalidUrl) {
	  var _e$code;
	  tsTypePredicates.typePredicates(e);
	  let message = e.message;
	  if (message === 'Invalid URL' || e.code === 'ERR_INVALID_URL' || errInvalidUrl) {
	    message = errIndent.messageWithSubErrors(e, [e, {
	      input,
	      baseURL
	    }]);
	    let meta = errStackMeta.errStackMeta(e);
	    e.stack = errIndent.errorsToMessageList([e, {
	      input,
	      baseURL
	    }], {}, e).concat([meta.stack]).join('\n');
	  }
	  if (e.message !== message) {
	    e.message = message;
	  }
	  let err = errcode(e, (_e$code = e.code) !== null && _e$code !== void 0 ? _e$code : 'ERR_INVALID_URL', {
	    input,
	    baseURL
	  });
	  return err;
	}
	function _newURL(input, baseURL) {
	  try {
	    return new URL(input, baseURL);
	  } catch (e) {
	    throw _wrapError(e, input, baseURL);
	  }
	}
	function isFakeProtocol(protocol) {
	  return protocol === "fake+http:" /* ENUM_FAKE.protocol */;
	}

	function isFakeHostname(hostname) {
	  return hostname === "url-fake-hostname" /* ENUM_FAKE.hostname */;
	}

	exports.LazyURL = LazyURL;
	exports.SYM_HIDDEN = SYM_HIDDEN;
	exports.SYM_URL = SYM_URL;
	exports._core = _core;
	exports.default = LazyURL;
	exports.findSymbolContext = findSymbolContext;
	exports.isFakeHostname = isFakeHostname;
	exports.isFakeProtocol = isFakeProtocol;

	Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=index.umd.development.cjs.map
