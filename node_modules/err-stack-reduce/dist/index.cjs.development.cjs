'use strict';

var errStackMeta = require('err-stack-meta');

/**
 * reduce stame stack from sub error with parent error
 *
 * @example
 * const stackReduce = errStackReduceCore(mainError, options.stackReduceOptions);
 *
 * console.dir(stackReduce(error));
 */
function errStackReduceCore(mainError, mainOptions) {
  const stack = errStackMeta.errStackMeta(mainError).stack;
  const {
    start = 1,
    end = 5
  } = mainOptions !== null && mainOptions !== void 0 ? mainOptions : {};
  return (error, options) => {
    var _options$start, _options$end;
    let _meta = errStackMeta.errStackMeta(error);
    let _stack = _meta.stack.split('\n');
    let _start = (_options$start = options === null || options === void 0 ? void 0 : options.start) !== null && _options$start !== void 0 ? _options$start : start;
    let _end = (_options$end = options === null || options === void 0 ? void 0 : options.end) !== null && _options$end !== void 0 ? _options$end : end;
    let i = _start;
    do {
      var _stack$i;
      if ((_stack$i = _stack[i]) !== null && _stack$i !== void 0 && _stack$i.length && stack.includes(_stack[i].trim())) {
        _stack = _stack.slice(0, i);
        break;
      }
    } while (i++ < _end || i >= _stack.length);
    return {
      ..._meta,
      stack: _stack.join('\n'),
      originalStack: _meta.stack
    };
  };
}
/**
 * reduce stame stack from sub error with parent error
 *
 * recommend use {@link errStackReduceCore}
 */
function errStackReduce(error, mainError, mainOptions) {
  return errStackReduceCore(mainError, mainOptions)(error);
}
// @ts-ignore
{
  Object.defineProperty(errStackReduceCore, "__esModule", {
    value: true
  });
  Object.defineProperty(errStackReduceCore, 'errStackReduceCore', {
    value: errStackReduceCore
  });
  Object.defineProperty(errStackReduceCore, 'default', {
    value: errStackReduceCore
  });
  Object.defineProperty(errStackReduceCore, 'errStackReduce', {
    value: errStackReduce
  });
}

// @ts-ignore
module.exports = errStackReduceCore;
//# sourceMappingURL=index.cjs.development.cjs.map
