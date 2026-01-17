export declare function replaceProtocol(href: string, protocol: string): string;
/**
 * @internal
 */
export declare function _fixReplaceURLProtocol<T extends URL, P extends string = string>(url: T, oldProtocol: string, newProtocol: P): asserts url is T & {
	protocol: P;
};
/**
 * @internal
 */
export declare function _isSameProtocol<T extends string>(actualProtocol: string, expectedProtocol: T): actualProtocol is T;
export declare function assertProtocolNotEqual(actualProtocol: string, expectedProtocol: string): void;
export declare function assertProtocolEqual<T extends string>(actualProtocol: string, expectedProtocol: T): asserts actualProtocol is T;
export declare function replaceThisProtocol<T extends URL>(this: T, protocol: string): T;
/**
 * helper for avoid node.js can't update protocol for some url
 *
 * @see https://github.com/nodejs/node/issues/39732
 */
export declare function replaceURLProtocol<T extends URL, P extends string = string>(url: T, protocol: P): T;

export {
	replaceURLProtocol as default,
};

export {};
