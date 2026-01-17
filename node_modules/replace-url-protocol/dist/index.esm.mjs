import { notStrictEqual as o, strictEqual as r } from "assert";

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
  o(r, t);
}

function assertProtocolEqual(o, t) {
  r(o, t);
}

function replaceThisProtocol(o) {
  return replaceURLProtocol(this, o);
}

function replaceURLProtocol(o, r) {
  const t = o.protocol;
  return _isSameProtocol(t, r) || (o.protocol = r, _fixReplaceURLProtocol(o, t, r)), 
  o;
}

export { _fixReplaceURLProtocol, _isSameProtocol, assertProtocolEqual, assertProtocolNotEqual, replaceURLProtocol as default, replaceProtocol, replaceThisProtocol, replaceURLProtocol };
//# sourceMappingURL=index.esm.mjs.map
