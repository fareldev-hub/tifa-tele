/**
 * support
 * - {@link AggregateError}
 * - {@link Bluebird.AggregateError}
 */
export function getSubErrors<T>(mainError: Error): Iterable<T>
{
	return (mainError as AggregateError).errors ?? (mainError as any as IterableIterator<T>)[Symbol.iterator]?.() ?? (mainError as any as Array<T>).slice?.()
}

export default getSubErrors
