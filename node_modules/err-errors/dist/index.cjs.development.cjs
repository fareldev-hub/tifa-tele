'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

/**
 * support
 * - {@link AggregateError}
 * - {@link Bluebird.AggregateError}
 */
function getSubErrors(mainError) {
  var _ref, _mainError$errors, _mainError$Symbol$ite, _mainError$slice;
  return (_ref = (_mainError$errors = mainError.errors) !== null && _mainError$errors !== void 0 ? _mainError$errors : (_mainError$Symbol$ite = mainError[Symbol.iterator]) === null || _mainError$Symbol$ite === void 0 ? void 0 : _mainError$Symbol$ite.call(mainError)) !== null && _ref !== void 0 ? _ref : (_mainError$slice = mainError.slice) === null || _mainError$slice === void 0 ? void 0 : _mainError$slice.call(mainError);
}

exports.default = getSubErrors;
exports.getSubErrors = getSubErrors;
//# sourceMappingURL=index.cjs.development.cjs.map
