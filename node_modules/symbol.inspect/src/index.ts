/**
 * <symbol> that can be used to declare custom inspect functions.
 *
 * same as Symbol.for('nodejs.util.inspect.custom')
 * same as util.inspect.custom
 */
export const SymbolInspect = Symbol.for('nodejs.util.inspect.custom');
export default SymbolInspect;
