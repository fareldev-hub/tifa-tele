/**
 * support
 * - {@link AggregateError}
 * - {@link Bluebird.AggregateError}
 */
export declare function getSubErrors<T>(mainError: Error): Iterable<T>;

export {
	getSubErrors as default,
};

export {};
