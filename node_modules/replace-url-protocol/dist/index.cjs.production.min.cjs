"use strict";

Object.defineProperty(exports, "__esModule", {
  value: !0
});

var o = require("assert");

function replaceProtocol(o, r) {
  return o.replace(/^[^:]+:/, r);
}

function _fixReplaceURLProtocol(o, r, t) {
  _isSameProtocol(o.protocol, r) && (o.href = replaceProtocol(o.href, t), assertProtocolNotEqual(o.protocol, r));
}

function _isSameProtocol(o, r) {
  return o === r;
}

function assertProtocolNotEqual(r, t) {
  o.notStrictEqual(r, t);
}

function replaceURLProtocol(o, r) {
  const t = o.protocol;
  return _isSameProtocol(t, r) || (o.protocol = r, _fixReplaceURLProtocol(o, t, r)), 
  o;
}

exports._fixReplaceURLProtocol = _fixReplaceURLProtocol, exports._isSameProtocol = _isSameProtocol, 
exports.assertProtocolEqual = function assertProtocolEqual(r, t) {
  o.strictEqual(r, t);
}, exports.assertProtocolNotEqual = assertProtocolNotEqual, exports.default = replaceURLProtocol, 
exports.replaceProtocol = replaceProtocol, exports.replaceThisProtocol = function replaceThisProtocol(o) {
  return replaceURLProtocol(this, o);
}, exports.replaceURLProtocol = replaceURLProtocol;
//# sourceMappingURL=index.cjs.production.min.cjs.map
