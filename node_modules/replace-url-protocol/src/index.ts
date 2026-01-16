import { notStrictEqual, strictEqual } from 'assert';

export function replaceProtocol(href: string, protocol: string)
{
	return href.replace(/^[^:]+:/, protocol)
}

/**
 * @internal
 */
export function _fixReplaceURLProtocol<T extends URL, P extends string = string>(url: T, oldProtocol: string, newProtocol: P): asserts url is T & {
	protocol: P,
}
{
	if (_isSameProtocol(url.protocol, oldProtocol))
	{
		url.href = replaceProtocol(url.href, newProtocol);
		assertProtocolNotEqual(url.protocol, oldProtocol);
	}
}

/**
 * @internal
 */
export function _isSameProtocol<T extends string>(actualProtocol: string, expectedProtocol: T): actualProtocol is T
{
	return actualProtocol === expectedProtocol
}

export function assertProtocolNotEqual(actualProtocol: string, expectedProtocol: string)
{
	notStrictEqual(actualProtocol, expectedProtocol);
}

export function assertProtocolEqual<T extends string>(actualProtocol: string, expectedProtocol: T): asserts actualProtocol is T
{
	strictEqual(actualProtocol, expectedProtocol);
}

export function replaceThisProtocol<T extends URL>(this: T, protocol: string)
{
	return replaceURLProtocol(this, protocol);
}

/**
 * helper for avoid node.js can't update protocol for some url
 *
 * @see https://github.com/nodejs/node/issues/39732
 */
export function replaceURLProtocol<T extends URL, P extends string = string>(url: T, protocol: P)
{
	const old = url.protocol;

	if (!_isSameProtocol(old, protocol))
	{
		url.protocol = protocol
		_fixReplaceURLProtocol(url, old, protocol);
	}

	return url;
}

export default replaceURLProtocol
