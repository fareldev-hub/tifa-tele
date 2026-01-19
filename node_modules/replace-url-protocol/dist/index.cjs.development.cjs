'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var assert = require('assert');

function replaceProtocol(href, protocol) {
  return href.replace(/^[^:]+:/, protocol);
}
/**
 * @internal
 */
function _fixReplaceURLProtocol(url, oldProtocol, newProtocol) {
  if (_isSameProtocol(url.protocol, oldProtocol)) {
    url.href = replaceProtocol(url.href, newProtocol);
    assertProtocolNotEqual(url.protocol, oldProtocol);
  }
}
/**
 * @internal
 */
function _isSameProtocol(actualProtocol, expectedProtocol) {
  return actualProtocol === expectedProtocol;
}
function assertProtocolNotEqual(actualProtocol, expectedProtocol) {
  assert.notStrictEqual(actualProtocol, expectedProtocol);
}
function assertProtocolEqual(actualProtocol, expectedProtocol) {
  assert.strictEqual(actualProtocol, expectedProtocol);
}
function replaceThisProtocol(protocol) {
  return replaceURLProtocol(this, protocol);
}
/**
 * helper for avoid node.js can't update protocol for some url
 *
 * @see https://github.com/nodejs/node/issues/39732
 */
function replaceURLProtocol(url, protocol) {
  const old = url.protocol;
  if (!_isSameProtocol(old, protocol)) {
    url.protocol = protocol;
    _fixReplaceURLProtocol(url, old, protocol);
  }
  return url;
}

exports._fixReplaceURLProtocol = _fixReplaceURLProtocol;
exports._isSameProtocol = _isSameProtocol;
exports.assertProtocolEqual = assertProtocolEqual;
exports.assertProtocolNotEqual = assertProtocolNotEqual;
exports.default = replaceURLProtocol;
exports.replaceProtocol = replaceProtocol;
exports.replaceThisProtocol = replaceThisProtocol;
exports.replaceURLProtocol = replaceURLProtocol;
//# sourceMappingURL=index.cjs.development.cjs.map
