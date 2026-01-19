import indentString, { Options as IIndentOptions } from 'indent-string';
import _cleanStack from 'clean-stack';
import { inspect } from 'util';
import { isIterable } from 'check-iterable';
import { array_unique_overwrite } from 'array-hyper-unique';
import { getSubErrors } from 'err-errors';
import { errStackReduceCore, IOptions as IErrStackReduceOptions } from 'err-stack-reduce';
import { stringifyStackMeta } from 'err-stack-meta';
import { parseStack } from 'error-stack2';

export interface IOptions<T = any>
{
	error?: Error;

	handleStack?(stack: string, error: T): string;

	/**
	 * @default 4
	 */
	indent?: number,

	/**
	 * options for `indent-string`
	 */
	indentOptions?: IIndentOptions,

	stackReduceOptions?: IErrStackReduceOptions,
}

export type IIterableLike<T = any> = Iterable<T> | IterableIterator<T>;
export type IIterableAllowed<T, A extends IIterableLike<T>> = Exclude<A, string | String>;

export function _isAllowedIterable(arr: any)
{
	return (typeof arr !== 'string' && !(arr instanceof String) && isIterable(arr))
}

export function errorsToMessageList<T, A extends IIterableLike<T> = IIterableLike<T>>(errors: IIterableAllowed<T, A>,
	options?: IOptions<T>,
	mainError?: Error,
)
{
	if (!errors || !_isAllowedIterable(errors))
	{
		throw new TypeError(`Invalid input errors: ${errors}`)
	}

	options ??= {};

	const { handleStack = (stack: string) => _cleanStack(stack) } = options;

	mainError ??= options.error;

	let _main: string;

	let ls: string[] = [];

	const stackReduce = errStackReduceCore(mainError, options.stackReduceOptions);

	(errors as any as (T & Error)[])
		.forEach((error) =>
		{
			if (error === void 0 || error === null)
			{
				return
			}

			if (mainError === error)
			{
				_main = String(error)
			}
			else if (typeof error.stack === 'string')
			{
				ls.push(handleStack(stringifyStackMeta(stackReduce(error)), error))
			}
			else
			{
				ls.push(inspect(error))
			}

		})
	;

	ls = ls.filter(s => s?.length)

	if (_main?.length)
	{
		ls.unshift(_main)
	}

	return array_unique_overwrite(ls)
}

export function indentSubErrorMessage(sub_message: string | IIterableLike<string>, options?: IOptions)
{
	if (_isAllowedIterable(sub_message))
	{
		sub_message = [...sub_message].join('\n');
	}

	options ??= {};

	return indentString(sub_message as string, options.indent ?? 4, options.indentOptions)
}

export function indentSubErrors<T, A extends IIterableLike<T> = IIterableLike<T>>(errors: IIterableAllowed<T, A>,
	options?: IOptions<T>,
	mainError?: Error,
)
{
	const sub_message = errorsToMessageList(errors, options, mainError);
	return indentSubErrorMessage(sub_message, options);
}

export function indentSubErrorsFromError<T, A extends IIterableLike<T> = IIterableLike<T>>(mainError?: Error,
	options?: IOptions<T>,
)
{
	let errors = getSubErrors(mainError) as IIterableAllowed<T, A>;

	return indentSubErrors(errors, options, mainError)
}

export function messageWithSubErrors<T, A extends IIterableLike<T> = IIterableLike<T>>(mainError: Error,
	errors?: IIterableAllowed<T, A>,
	options?: IOptions<T>,
)
{
	errors ??= getSubErrors(mainError) as IIterableAllowed<T, A>;

	let _e = parseStack(mainError.stack, mainError.message);

	let lines = [] as string[];

	if (typeof _e.message !== 'undefined')
	{
		lines.push(_e.message);
	}

	let _em2 = indentSubErrors(errors, options, mainError);

	if (_em2.length)
	{
		if (lines.length === 0)
		{
			lines.push('');
		}
		lines.push(_em2);
	}

	if (lines.length)
	{
		return lines.join('\n')
	}

	return void 0;
}

export default messageWithSubErrors
