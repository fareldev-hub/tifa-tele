function getSubErrors(r) {
  var l, o, u, e;
  return null !== (l = null !== (o = r.errors) && void 0 !== o ? o : null === (u = r[Symbol.iterator]) || void 0 === u ? void 0 : u.call(r)) && void 0 !== l ? l : null === (e = r.slice) || void 0 === e ? void 0 : e.call(r);
}

export { getSubErrors as default, getSubErrors };
//# sourceMappingURL=index.esm.mjs.map
