!function(o, e) {
  "object" == typeof exports && "undefined" != typeof module ? e(exports, require("assert")) : "function" == typeof define && define.amd ? define([ "exports", "assert" ], e) : e((o = "undefined" != typeof globalThis ? globalThis : o || self).ReplaceUrlProtocol = {}, o.assert);
}(this, (function(o, e) {
  "use strict";
  function replaceProtocol(o, e) {
    return o.replace(/^[^:]+:/, e);
  }
  function _fixReplaceURLProtocol(o, e, t) {
    _isSameProtocol(o.protocol, e) && (o.href = replaceProtocol(o.href, t), assertProtocolNotEqual(o.protocol, e));
  }
  function _isSameProtocol(o, e) {
    return o === e;
  }
  function assertProtocolNotEqual(o, t) {
    e.notStrictEqual(o, t);
  }
  function replaceURLProtocol(o, e) {
    const t = o.protocol;
    return _isSameProtocol(t, e) || (o.protocol = e, _fixReplaceURLProtocol(o, t, e)), 
    o;
  }
  o._fixReplaceURLProtocol = _fixReplaceURLProtocol, o._isSameProtocol = _isSameProtocol, 
  o.assertProtocolEqual = function assertProtocolEqual(o, t) {
    e.strictEqual(o, t);
  }, o.assertProtocolNotEqual = assertProtocolNotEqual, o.default = replaceURLProtocol, 
  o.replaceProtocol = replaceProtocol, o.replaceThisProtocol = function replaceThisProtocol(o) {
    return replaceURLProtocol(this, o);
  }, o.replaceURLProtocol = replaceURLProtocol, Object.defineProperty(o, "__esModule", {
    value: !0
  });
}));
//# sourceMappingURL=index.umd.production.min.cjs.map
