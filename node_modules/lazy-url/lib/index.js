"use strict";
/**
 * Created by user on 2019/6/6.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFakeHostname = exports.isFakeProtocol = exports._core = exports.findSymbolContext = exports.LazyURL = exports.ENUM_FAKE = exports.SYM_HIDDEN = exports.SYM_URL = void 0;
const tslib_1 = require("tslib");
const url_parse_1 = (0, tslib_1.__importDefault)(require("url-parse"));
const util_1 = require("util");
const ts_type_predicates_1 = require("ts-type-predicates");
const err_code_1 = (0, tslib_1.__importDefault)(require("err-code"));
const replace_url_protocol_1 = require("replace-url-protocol");
const err_indent_1 = require("err-indent");
const err_stack_meta_1 = require("err-stack-meta");
exports.SYM_URL = Symbol('url');
exports.SYM_HIDDEN = Symbol('hidden');
var ENUM_FAKE;
(function (ENUM_FAKE) {
    ENUM_FAKE["protocol"] = "fake+http:";
    ENUM_FAKE["hostname"] = "url-fake-hostname";
})(ENUM_FAKE = exports.ENUM_FAKE || (exports.ENUM_FAKE = {}));
const SymbolContext = findSymbolContext();
class LazyURL extends URL {
    constructor(url, base) {
        let u = _core(url, base);
        super(u.url.href);
        //this[SYM_URL] = _url;
        this[exports.SYM_HIDDEN] = u.hidden;
        //_numerable(this)
    }
    static create(url, base) {
        return new this(url, base);
    }
    /*
    [SymbolInspect]()
    {
        return `LazyURL {
  href: '${this.href}',
  href: '${this.toRealString()}',
  origin: '${this.origin}',
  protocol: '${this.protocol}',
  username: '${this.username}',
  password: '${this.password}',
  host: '${this.host}',
  hostname: '${this.hostname}',
  port: '${this.port}',
  pathname: '${this.pathname}',
  search: '${this.search}',
  searchParams: ${util.inspect(this.searchParams)},
  hash: '${this.hash}'
}`;
    }
     */
    /*
    [SymbolInspect]()
    {
        return `LazyURL(${this.href})`;
    }

     */
    get paths() {
        if (SymbolContext != null && this[SymbolContext] && Array.isArray(this[SymbolContext].path)) {
            return this[SymbolContext].path.slice();
        }
        return this.pathname
            .split('/')
            .filter(v => v !== '');
    }
    fakeExists() {
        return this.fakeKeys().length;
    }
    fakeKeys() {
        return Object.keys(this[exports.SYM_HIDDEN]);
    }
    fakeEntries() {
        return Object.entries(this[exports.SYM_HIDDEN]);
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
            let u = (0, url_parse_1.default)(this.href);
            ks
                .forEach(([name, value]) => {
                if (u[name] === value) {
                    u.set(name, '');
                }
            });
            if (u.host === '') {
                if (options === null || options === void 0 ? void 0 : options.ignoreInvalid) {
                    u.set('username', '');
                    u.set('password', '');
                    u.set('port', '');
                    u.set('protocol', '');
                }
                else if (u.username !== '' || u.password !== '' || u.port !== '' || u.protocol !== '') {
                    //throw new TypeError(`Invalid URL ${u}`)
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
    /*
    toJSON()
    {
        return this[SYM_URL].toJSON();
    }
     */
    /*
    get hash()
    {
        return this[SYM_URL].hash
    }

    set hash(value)
    {
        this[SYM_URL].hash = value
    }

    get host()
    {
        return this[SYM_URL].host
    }

    set host(value)
    {
        delete this[SYM_HIDDEN].hostname;

        this[SYM_URL].host = value
    }
     */
    get hostname() {
        return super.hostname;
    }
    set hostname(value) {
        if (!isFakeHostname(value)) {
            delete this[exports.SYM_HIDDEN].hostname;
        }
        super.hostname = value;
    }
    get href() {
        return super.href;
    }
    set href(value) {
        super.href = value;
        if (isFakeProtocol(super.protocol)) {
            this[exports.SYM_HIDDEN].protocol = "fake+http:" /* protocol */;
        }
        if (isFakeHostname(super.hostname)) {
            this[exports.SYM_HIDDEN].hostname = "url-fake-hostname" /* hostname */;
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
    /*

    get password()
    {
        return this[SYM_URL].password
    }

    set password(value)
    {
        this[SYM_URL].password = value
    }

    get pathname()
    {
        return this[SYM_URL].pathname
    }

    set pathname(value)
    {
        this[SYM_URL].pathname = value
    }

     */
    get port() {
        return super.port;
    }
    set port(value) {
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
        super.port = value !== null && value !== void 0 ? value : '';
    }
    get protocol() {
        return super.protocol;
    }
    set protocol(value) {
        if (typeof value !== 'string' || value.length < 2 || !value.endsWith(':')) {
            throw new TypeError(`Invalid protocol input: ${value}`);
        }
        if (!isFakeProtocol(value)) {
            delete this[exports.SYM_HIDDEN].protocol;
        }
        const old = super.protocol;
        if (old !== value) {
            super.protocol = value;
            /**
             * avoid bug of https://github.com/nodejs/node/issues/39732
             */
            (0, replace_url_protocol_1._fixReplaceURLProtocol)(this, old, value);
        }
    }
    get auth() {
        var _a, _b;
        if ((_a = this.username) === null || _a === void 0 ? void 0 : _a.length) {
            return `${this.username}:${(_b = this.password) !== null && _b !== void 0 ? _b : ''}`;
        }
        return '';
    }
    set auth(value) {
        this.username = '';
        this.password = '';
        let ls = value === null || value === void 0 ? void 0 : value.split(':');
        if (ls === null || ls === void 0 ? void 0 : ls.length) {
            this.username = ls.shift();
            this.password = ls.join(':');
        }
    }
    /*
    get search()
    {
        return this[SYM_URL].search
    }

    set search(value)
    {
        this[SYM_URL].search = value
    }

    get searchParams()
    {
        return this[SYM_URL].searchParams
    }

    get username()
    {
        return this[SYM_URL].username
    }

    set username(value)
    {
        this[SYM_URL].username = value
    }

     */
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
            }
            else {
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
        return [
            'href',
            'protocol',
            'username',
            'password',
            'host',
            'hostname',
            'port',
            'pathname',
            'search',
            'searchParams',
            'hash',
        ];
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
exports.LazyURL = LazyURL;
function _numerable(lib) {
    let ds = Object.getOwnPropertyDescriptors(lib);
    [
        'href',
        'protocol',
        'username',
        'password',
        'host',
        'hostname',
        'port',
        'pathname',
        'search',
        'searchParams',
        'hash',
    ]
        .forEach((name) => {
        if (name in ds) {
            ds[name].enumerable = true;
            Object.defineProperty(lib, name, ds[name]);
        }
    });
}
function findSymbolContext() {
    let u = _newURL(`https://localhost`);
    const SymbolContext = Object.getOwnPropertySymbols(u)
        .filter(sym => u[sym].host == 'localhost')[0];
    return SymbolContext;
}
exports.findSymbolContext = findSymbolContext;
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
        }
        else if (url instanceof URL) {
            url = url.href;
        }
        else if (typeof url.href === 'string') {
            url = url.href;
            base !== null && base !== void 0 ? base : (base = url.baseURI);
        }
    }
    if (typeof url !== 'string') {
        throw _wrapError(new TypeError(`Argument '${(0, util_1.inspect)(url)}' is not assignable to url like.`), url, base);
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
    }
    catch (e) {
        let ok;
        (0, ts_type_predicates_1.typePredicates)(e);
        if (e.code === 'ERR_INVALID_URL' || /Invalid URL/.test(e.message)) {
            if (typeof base === 'string') {
                let old = base;
                let u = (0, url_parse_1.default)(base) /* as URL & {
                        set(name: keyof URL, value: string): void
                    }*/;
                if ((u.host === ''
                    || u.protocol === '')) {
                    if (!old.includes('/') && [
                        u.protocol + u.host,
                        u.protocol + u.pathname,
                    ].includes(old.toLowerCase())) {
                        u = (0, url_parse_1.default)('');
                        u.set('host', old);
                        u.set('protocol', "fake+http:" /* protocol */);
                        u.set('pathname', '');
                        _hidden_.protocol = "fake+http:" /* protocol */;
                    }
                    if (u.host === '') {
                        if (u.pathname != '' && !u.pathname.includes('/')) {
                            u.set('host', u.pathname);
                            u.set('pathname', '');
                        }
                        else {
                            u.set('host', "url-fake-hostname" /* hostname */);
                            _hidden_.hostname = u.hostname;
                        }
                    }
                    if (u.protocol === '') {
                        u.set('protocol', "fake+http:" /* protocol */);
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
            }
            else if ((url == null || url === '') && base == null) {
            }
            else if (url != null && base == null) {
                base = `${"fake+http:" /* protocol */}//${"url-fake-hostname" /* hostname */}`;
                _url = _newURL(url, base);
                _hidden_.protocol = "fake+http:" /* protocol */;
                _hidden_.hostname = "url-fake-hostname" /* hostname */;
                ok = true;
            }
        }
        if (!ok) {
            throw e;
        }
    }
    return {
        url: _url,
        hidden: _hidden_,
    };
}
exports._core = _core;
function _wrapError(e, input, baseURL, errInvalidUrl) {
    var _a;
    (0, ts_type_predicates_1.typePredicates)(e);
    let message = e.message;
    if (message === 'Invalid URL' || e.code === 'ERR_INVALID_URL' || errInvalidUrl) {
        message = (0, err_indent_1.messageWithSubErrors)(e, [
            e,
            {
                input,
                baseURL,
            },
        ]);
        let meta = (0, err_stack_meta_1.errStackMeta)(e);
        e.stack = (0, err_indent_1.errorsToMessageList)([
            e,
            {
                input,
                baseURL,
            },
        ], {}, e).concat([meta.stack]).join('\n');
    }
    if (e.message !== message) {
        e.message = message;
    }
    let err = (0, err_code_1.default)(e, (_a = e.code) !== null && _a !== void 0 ? _a : 'ERR_INVALID_URL', {
        input,
        baseURL,
    });
    return err;
}
function _newURL(input, baseURL) {
    try {
        return new URL(input, baseURL);
    }
    catch (e) {
        throw _wrapError(e, input, baseURL);
    }
}
function isFakeProtocol(protocol) {
    return protocol === "fake+http:" /* protocol */;
}
exports.isFakeProtocol = isFakeProtocol;
function isFakeHostname(hostname) {
    return hostname === "url-fake-hostname" /* hostname */;
}
exports.isFakeHostname = isFakeHostname;
exports.default = LazyURL;
//# sourceMappingURL=index.js.map