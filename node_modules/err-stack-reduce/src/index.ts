import { errStackMeta } from 'err-stack-meta';

export interface IOptions
{
	/**
	 * @default 1
	 */
	start?: number;
	/**
	 * @default 5
	 */
	end?: number;
}

/**
 * reduce stame stack from sub error with parent error
 *
 * @example
 * const stackReduce = errStackReduceCore(mainError, options.stackReduceOptions);
 *
 * console.dir(stackReduce(error));
 */
export function errStackReduceCore(mainError: Error, mainOptions?: IOptions)
{
	const stack = errStackMeta(mainError).stack;
	const { start = 1, end = 5 } = mainOptions ?? {};

	return (error: Error, options?: IOptions) =>
	{
		let _meta = errStackMeta(error);
		let _stack = _meta.stack.split('\n');

		let _start = options?.start ?? start;
		let _end = options?.end ?? end;

		let i: number = _start;

		do
		{
			if (_stack[i]?.length && stack.includes(_stack[i].trim()))
			{
				_stack = _stack.slice(0, i)
				break;
			}
		}
		while (i++ < _end || i >= _stack.length);

		return {
			..._meta,
			stack: _stack.join('\n'),
			originalStack: _meta.stack,
		}
	}
}

/**
 * reduce stame stack from sub error with parent error
 *
 * recommend use {@link errStackReduceCore}
 */
export function errStackReduce(error: Error, mainError: Error, mainOptions?: IOptions)
{
	return errStackReduceCore(mainError, mainOptions)(error)
}

export default errStackReduceCore

// @ts-ignore
if (process.env.TSDX_FORMAT !== 'esm')
{
	Object.defineProperty(errStackReduceCore, "__esModule", { value: true });

	Object.defineProperty(errStackReduceCore, 'errStackReduceCore', { value: errStackReduceCore });
	Object.defineProperty(errStackReduceCore, 'default', { value: errStackReduceCore });

	Object.defineProperty(errStackReduceCore, 'errStackReduce', { value: errStackReduce });
}
