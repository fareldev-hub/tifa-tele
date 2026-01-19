'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var lazyUrl = require('lazy-url');
var httpFormUrlencoded = require('http-form-urlencoded');

function resultToURL(result, options, res) {
  var _ref;
  return requestToURL(result === null || result === void 0 ? void 0 : result.request, options, (_ref = res !== null && res !== void 0 ? res : options === null || options === void 0 ? void 0 : options.response) !== null && _ref !== void 0 ? _ref : result);
}
function requestToURL(req, options, res) {
  try {
    var _ref2, _req$url, _req$res;
    return new lazyUrl.LazyURL((_ref2 = (_req$url = req.url) !== null && _req$url !== void 0 ? _req$url : (_req$res = req.res) === null || _req$res === void 0 ? void 0 : _req$res.responseUrl) !== null && _ref2 !== void 0 ? _ref2 : _requestToURL(req, res !== null && res !== void 0 ? res : options === null || options === void 0 ? void 0 : options.response));
  } catch (e) {
    if (!(options !== null && options !== void 0 && options.ignoreError)) {
      throw e;
    }
  }
}
function _requestToURL(req, res) {
  var _ref3, _req$_currentRequest, _req$_options, _res, _options$protocol, _res$config;
  let href = req._currentUrl;
  let _currentRequest = (_ref3 = (_req$_currentRequest = req._currentRequest) !== null && _req$_currentRequest !== void 0 ? _req$_currentRequest : req) !== null && _ref3 !== void 0 ? _ref3 : {};
  let _options = (_req$_options = req._options) !== null && _req$_options !== void 0 ? _req$_options : {};
  (_res = res) !== null && _res !== void 0 ? _res : res = {};
  if ((_options$protocol = _options.protocol) !== null && _options$protocol !== void 0 && _options$protocol.length) {
    var _options$protocol2, _options$pathname, _ref4, _options$hostname, _currentRequest$getHe;
    let u;
    if (_options.protocol && _options.hostname) {
      u = new lazyUrl.LazyURL(_options.protocol + '//' + _options.hostname);
    } else {
      u = new lazyUrl.LazyURL(_currentRequest.path);
    }
    u.set('protocol', (_options$protocol2 = _options.protocol) !== null && _options$protocol2 !== void 0 ? _options$protocol2 : _currentRequest.protocol);
    u.set('port', _options.port);
    u.set('pathname', (_options$pathname = _options.pathname) !== null && _options$pathname !== void 0 ? _options$pathname : _currentRequest.path);
    u.set('query', _options.search);
    u.set('auth', _options.auth);
    u.set('hostname', (_ref4 = (_options$hostname = _options.hostname) !== null && _options$hostname !== void 0 ? _options$hostname : (_currentRequest$getHe = _currentRequest.getHeader) === null || _currentRequest$getHe === void 0 ? void 0 : _currentRequest$getHe.call(_currentRequest, 'Host')) !== null && _ref4 !== void 0 ? _ref4 : _currentRequest.host);
    href = u;
  } else if (typeof _currentRequest.getHeader === 'function') {
    var _ref5;
    let u = new lazyUrl.LazyURL((_ref5 = req.protocol + '//' + _currentRequest.getHeader('Host')) !== null && _ref5 !== void 0 ? _ref5 : _currentRequest.host);
    u.pathname = req.path;
    u.protocol = req.protocol;
    href = u;
  } else if (!href && (_res$config = res.config) !== null && _res$config !== void 0 && _res$config.url) {
    href = new lazyUrl.LazyURL(res.config.url, res.config.baseURL);
    if (typeof res.config.params !== 'undefined') {
      let sp = new httpFormUrlencoded.LazyURLSearchParams(res.config.params);
      sp.forEach((value, key) => {
        href.searchParams.set(key, value);
      });
    }
  }
  return new lazyUrl.LazyURL(href);
}

exports._requestToURL = _requestToURL;
exports.default = requestToURL;
exports.requestToURL = requestToURL;
exports.resultToURL = resultToURL;
//# sourceMappingURL=index.cjs.development.cjs.map
