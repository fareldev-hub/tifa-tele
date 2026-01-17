import { ITSPickExtra, ITSRequiredPick } from 'ts-type/lib/type/record';
import { parseStack, formatMessagePrefix, IParsed } from 'error-stack2';

export interface IErrStackMeta<E extends Error> extends ITSRequiredPick<IParsed, 'rawTrace' | 'type'>
{
	prefix: string;
	message: string;
	stack: string;
	error: E;
}

export function errStackMeta<E extends Error>(error: E): IErrStackMeta<E>
{
	let es = parseStack(error.stack, error.message);

	return {
		type: es.type,
		prefix: formatMessagePrefix(es) + ': ',
		message: es.message,
		rawTrace: es.rawTrace,
		stack: es.rawTrace.join('\n'),
		error,
	}
}

export function stringifyStackMeta(meta: ITSPickExtra<IErrStackMeta<any>, 'prefix' | 'message'>, stack?: string)
{
	stack ??= meta.stack;

	if (stack.length)
	{
		stack = `\n${stack}`;
	}

	return `${meta.prefix}${meta.message ?? ''}${stack}`
}

export default errStackMeta
