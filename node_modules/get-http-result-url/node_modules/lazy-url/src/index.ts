/**
 * Created by user on 2019/6/6.
 */

import urlParse, { StringifyQuery, URLPart } from 'url-parse';
import SymbolInspect from 'symbol.inspect';
import { inspect } from 'util';
import { typePredicates } from 'ts-type-predicates';
import errcode from 'err-code';
import { _fixReplaceURLProtocol } from 'replace-url-protocol';
import { errorsToMessageList, messageWithSubErrors } from 'err-indent';
import { errStackMeta, stringifyStackMeta } from 'err-stack-meta';

export type IURLLike = string | URL | IURLObjectLike;
export const SYM_URL = Symbol('url');
export const SYM_HIDDEN = Symbol('hidden');

export const enum ENUM_FAKE
{
	protocol = 'fake+http:',
	hostname = 'url-fake-hostname',
}

const SymbolContext = findSymbolContext();

export class LazyURL extends URL implements URL
{
	/**
	 * @deprecated
	 */
	protected [SYM_URL]?: URL;
	protected [SYM_HIDDEN]: Partial<URL>;

	static create(url: IURLLike | [IURLLike, IURLLike?], base?: IURLLike)
	{
		return new this(url, base)
	}

	constructor(url: IURLLike | [IURLLike, IURLLike?], base?: IURLLike)
	{
		let u = _core(url, base)

		super(u.url.href);

		//this[SYM_URL] = _url;
		this[SYM_HIDDEN] = u.hidden;

		//_numerable(this)
	}

	/*
	[SymbolInspect]()
	{
		return `LazyURL {
  href: '${this.href}',
  href: '${this.toRealString()}',
  origin: '${this.origin}',
  protocol: '${this.protocol}',
  username: '${this.username}',
  password: '${this.password}',
  host: '${this.host}',
  hostname: '${this.hostname}',
  port: '${this.port}',
  pathname: '${this.pathname}',
  search: '${this.search}',
  searchParams: ${util.inspect(this.searchParams)},
  hash: '${this.hash}'
}`;
	}
	 */

	/*
	[SymbolInspect]()
	{
		return `LazyURL(${this.href})`;
	}

	 */

	get paths(): string[]
	{
		if (SymbolContext != null && this[SymbolContext] && Array.isArray(this[SymbolContext].path))
		{
			return this[SymbolContext].path.slice();
		}

		return this.pathname
			.split('/')
			.filter(v => v !== '')
	}

	fakeExists()
	{
		return this.fakeKeys().length
	}

	fakeKeys()
	{
		return Object.keys(this[SYM_HIDDEN])
	}

	fakeEntries()
	{
		return Object.entries(this[SYM_HIDDEN])
	}

	/**
	 * get the real url (remove fake value)
	 * throw error if not a valid url
	 *
	 * @returns {string}
	 */
	toRealString(options?: {
		ignoreInvalid?: boolean,
		stringify?: StringifyQuery,
	})
	{
		let ks = this.fakeEntries();

		if (ks.length)
		{
			let u = urlParse(this.href);

			ks
				.forEach(([name, value]) =>
				{
					if (u[name] === value)
					{
						u.set(name as any, '');
					}
				})
			;

			if (u.host === '')
			{
				if (options?.ignoreInvalid)
				{
					u.set('username', '');
					u.set('password', '');
					u.set('port', '');
					u.set('protocol', '');
				}
				else if (u.username !== '' || u.password !== '' || u.port !== '' || u.protocol !== '')
				{
					//throw new TypeError(`Invalid URL ${u}`)

					throw _wrapError(new TypeError(`Invalid URL`), u)
				}
			}

			let s = u.toString(options?.stringify);

			if (u.protocol === '' && u.host === '')
			{
				s = s.replace(/^\/\//, '');
			}

			return s
		}

		return this.href;
	}

	override toString()
	{
		return this.href;
	}

	/*
	toJSON()
	{
		return this[SYM_URL].toJSON();
	}
	 */

	/*
	get hash()
	{
		return this[SYM_URL].hash
	}

	set hash(value)
	{
		this[SYM_URL].hash = value
	}

	get host()
	{
		return this[SYM_URL].host
	}

	set host(value)
	{
		delete this[SYM_HIDDEN].hostname;

		this[SYM_URL].host = value
	}
	 */

	override get hostname()
	{
		return super.hostname
	}

	override set hostname(value)
	{
		if (!isFakeHostname(value))
		{
			delete this[SYM_HIDDEN].hostname;
		}

		super.hostname = value
	}

	override get href()
	{
		return super.href
	}

	override set href(value: string)
	{
		super.href = value

		if (isFakeProtocol(super.protocol))
		{
			this[SYM_HIDDEN].protocol = ENUM_FAKE.protocol
		}

		if (isFakeHostname(super.hostname))
		{
			this[SYM_HIDDEN].hostname = ENUM_FAKE.hostname
		}
	}

	override get origin(): string
	{
		let origin = super.origin;

		if ((typeof origin === 'undefined' || origin === null || origin === 'null' || origin === 'undefined') && super.protocol.length)
		{
			/**
			 * @see https://github.com/nodejs/node/issues/39732#issuecomment-896624653
			 */
			origin = super.protocol + '//' + super.hostname;
		}

		return origin
	}

	/*

	get password()
	{
		return this[SYM_URL].password
	}

	set password(value)
	{
		this[SYM_URL].password = value
	}

	get pathname()
	{
		return this[SYM_URL].pathname
	}

	set pathname(value)
	{
		this[SYM_URL].pathname = value
	}

	 */

	override get port(): string
	{
		return super.port
	}

	override set port(value: string | number)
	{
		if (typeof value === 'string' && value !== '')
		{
			let old = value.toString().trim();

			value = parseInt(value)

			if (old !== value.toString())
			{
				throw new TypeError(`Invalid port input: { '${old}' => ${value} }`)
			}
		}

		if (typeof value === 'number')
		{
			if (Number.isNaN(value) || !Number.isFinite(value) || value < 0 || value > 65535)
			{
				throw new RangeError(`Invalid port range: ${value}`)
			}

			value = value.toString();
		}

		super.port = value ?? ''
	}

	override get protocol()
	{
		return super.protocol
	}

	override set protocol(value)
	{
		if (typeof value !== 'string' || value.length < 2 || !value.endsWith(':'))
		{
			throw new TypeError(`Invalid protocol input: ${value}`)
		}

		if (!isFakeProtocol(value))
		{
			delete this[SYM_HIDDEN].protocol;
		}

		const old = super.protocol;

		if (old !== value)
		{
			super.protocol = value;

			/**
			 * avoid bug of https://github.com/nodejs/node/issues/39732
			 */
			_fixReplaceURLProtocol(this, old, value);
		}
	}

	get auth(): string
	{
		if (this.username?.length)
		{
			return `${this.username}:${this.password ?? ''}`
		}

		return ''
	}

	set auth(value: string)
	{
		this.username = '';
		this.password = '';

		let ls = value?.split(':')

		if (ls?.length)
		{
			this.username = ls.shift();
			this.password = ls.join(':');
		}
	}

	/*
	get search()
	{
		return this[SYM_URL].search
	}

	set search(value)
	{
		this[SYM_URL].search = value
	}

	get searchParams()
	{
		return this[SYM_URL].searchParams
	}

	get username()
	{
		return this[SYM_URL].username
	}

	set username(value)
	{
		this[SYM_URL].username = value
	}

	 */

	/**
	 * @alias protocol
	 */
	get scheme()
	{
		return this.protocol
	}

	/**
	 * @alias protocol
	 */
	set scheme(value: string)
	{
		this.protocol = value;
	}

	/**
	 * @alias hash
	 */
	get fragment()
	{
		return this.hash
	}

	/**
	 * @alias hash
	 */
	set fragment(value: string)
	{
		this.hash = value;
	}

	/**
	 * @alias search
	 */
	get query()
	{
		return this.search
	}

	/**
	 * @alias search
	 */
	set query(value: string)
	{
		this.search = value;
	}

	toObject(): IURLObject
	{
		return LazyURL.toObject(this)
	}

	/**
	 * clone into a object
	 *
	 * @returns {IURLObject}
	 */
	static toObject(url: URL): IURLObject
	{
		return LazyURL.keys().reduce((a, b) =>
		{
			if (b === 'searchParams')
			{
				a[b] = new URLSearchParams(url.searchParams.entries() as any as [string, string][])
			}
			else
			{
				a[b] = url[b];
			}

			return a
		}, {} as IURLObject)
	}

	keys(): IUrlKeys[]
	{
		return LazyURL.keys()
	}

	values()
	{
		return LazyURL.values(this)
	}

	entries(): IEntries
	{
		return LazyURL.entries(this)
	}

	static keys(): IUrlKeys[]
	{
		return [
			'href',
			'protocol',
			'username',
			'password',
			'host',
			'hostname',
			'port',
			'pathname',
			'search',
			'searchParams',
			'hash',
		]
	}

	static values(url: URL)
	{
		return LazyURL.keys().map(name => url[name])
	}

	static entries(url: URL): IEntries
	{
		return LazyURL.keys().map(name => [name, url[name]]) as IEntries
	}

	createURLSearchParams(init?: string[][] | Record<string, string> | string | URLSearchParams | URL)
	{
		if (init instanceof URL)
		{
			init = init.searchParams;
		}

		return new URLSearchParams(init)
	}

	set<K extends Extract<URLPart, keyof LazyURL>>(part: K, value: LazyURL[K])
	{
		this[part] = value
	}

	get<K extends Extract<URLPart, keyof LazyURL>>(part: K): LazyURL[K]
	{
		return this[part]
	}

}

export type IEntries = (["hash" | "host" | "hostname" | "href" | "password" | "pathname" | "port" | "protocol" | "search" | "username", string] | ["searchParams", URLSearchParams])[]

export type IEntriesRow<T extends IUrlKeys> = [T, URL[T]]

function _numerable(lib)
{
	let ds = Object.getOwnPropertyDescriptors(lib);

	([
		'href',
		'protocol',
		'username',
		'password',
		'host',
		'hostname',
		'port',
		'pathname',
		'search',
		'searchParams',
		'hash',
	] as const)
		.forEach((name) =>
		{
			if (name in ds)
			{
				ds[name].enumerable = true;

				Object.defineProperty(lib, name, ds[name])
			}
		})
	;
}

export type IUrlKeys =
	| 'href'
	| 'username'
	| 'password'
	| 'host'
	| 'hostname'
	| 'port'
	| 'pathname'
	| 'search'
	| 'searchParams'
	| 'protocol'
	| 'hash'
	;

export function findSymbolContext(): symbol
{
	let u = _newURL(`https://localhost`);

	const SymbolContext = Object.getOwnPropertySymbols(u)
		.filter(sym => u[sym].host == 'localhost')[0]
	;

	return SymbolContext;
}

export interface IURLObjectLike
{
	href: string;
}

export interface IURLObject
{
	href: string;
	protocol: string;
	username: string;
	password: string;
	host: string;
	hostname: string;
	port: string;
	pathname: string;
	search: string;
	searchParams: URLSearchParams;
	hash: string;
}

/**
 * @private
 */
export function _core(url: IURLLike | [IURLLike, IURLLike?], base?: IURLLike)
{
	if (Array.isArray(url))
	{
		if (base == null)
		{
			[url, base] = url;
		}
	}

	if (typeof url !== 'undefined' && url !== null)
	{
		if (url instanceof LazyURL)
		{
			url = url.toRealString();
		}
		else if (url instanceof URL)
		{
			url = url.href;
		}
		else if (typeof (url as IURLObjectLike).href === 'string')
		{
			url = (url as IURLObjectLike).href;
			base ??= (url as any as HTMLLinkElement).baseURI;
		}
	}

	if (typeof url !== 'string')
	{
		throw _wrapError(new TypeError(`Argument '${inspect(url)}' is not assignable to url like.`), url, base)
	}

	let _url: URL;
	const _hidden_: Partial<URL> = {};

	if (typeof base !== 'string' && base != null && typeof base.href === 'string')
	{
		base = base.href;
	}

	if (base === '')
	{
		base = void 0;
	}

	try
	{
		_url = _newURL(url, base as string)
	}
	catch (e: unknown)
	{
		let ok: boolean;

		typePredicates<IURLError>(e);

		if (e.code === 'ERR_INVALID_URL' || /Invalid URL/.test(e.message))
		{
			if (typeof base === 'string')
			{
				let old = base;
				let u = urlParse(base)/* as URL & {
						set(name: keyof URL, value: string): void
					}*/;

				if ((
					u.host === ''
					|| u.protocol === ''
				))
				{
					if (!old.includes('/') && [
						u.protocol + u.host,
						u.protocol + u.pathname,
					].includes(old.toLowerCase()))
					{
						u = urlParse('');

						u.set('host', old);
						u.set('protocol', ENUM_FAKE.protocol);
						u.set('pathname', '');

						_hidden_.protocol = ENUM_FAKE.protocol;
					}

					if (u.host === '')
					{
						if (u.pathname != '' && !u.pathname.includes('/'))
						{
							u.set('host', u.pathname);
							u.set('pathname', '');
						}
						else
						{
							u.set('host', ENUM_FAKE.hostname);

							_hidden_.hostname = u.hostname;
						}
					}

					if (u.protocol === '')
					{
						u.set('protocol', ENUM_FAKE.protocol);
						_hidden_.protocol = u.protocol;
					}

					// @ts-ignore
					if (u.pathname !== '' && !u.pathname.startsWith('/'))
					{
						// @ts-ignore
						u.set('pathname', '/' + u.pathname);
					}

					_url = _newURL(url, u.toString());

					ok = true;
				}
			}
			else if ((url == null || url === '') && base == null)
			{

			}
			else if (url != null && base == null)
			{
				base = `${ENUM_FAKE.protocol}//${ENUM_FAKE.hostname}`;

				_url = _newURL(url, base);

				_hidden_.protocol = ENUM_FAKE.protocol;
				_hidden_.hostname = ENUM_FAKE.hostname;

				ok = true;
			}
		}

		if (!ok)
		{
			throw e
		}
	}

	return {
		url: _url,
		hidden: _hidden_,
	}
}

export interface IURLErrorNode extends Error
{
	code: 'ERR_INVALID_URL' | string,
	input: IURLLike,
}

export interface IURLError extends IURLErrorNode
{
	baseURL: IURLLike,
}

function _wrapError<T extends Error>(e: T, input: IURLLike | [IURLLike, IURLLike?], baseURL?: IURLLike, errInvalidUrl?: boolean): T & IURLError
{
	typePredicates<IURLError>(e);

	let message = e.message;

	if (message === 'Invalid URL' || e.code === 'ERR_INVALID_URL' || errInvalidUrl)
	{
		message = messageWithSubErrors(e, [
			e,
			{
				input,
				baseURL,
			},
		])

		let meta = errStackMeta(e);

		e.stack = errorsToMessageList([
			e,
			{
				input,
				baseURL,
			},
		], {}, e).concat([meta.stack]).join('\n');

	}

	if (e.message !== message)
	{
		e.message = message;
	}

	let err = errcode(e, e.code ?? 'ERR_INVALID_URL', {
		input,
		baseURL,
	});

	return err as any
}

function _newURL(input: string | URL, baseURL?: string | URL)
{
	try
	{
		return new URL(input, baseURL)
	}
	catch (e: unknown)
	{
		throw _wrapError(e as IURLError, input, baseURL);
	}
}

export function isFakeProtocol(protocol: string): protocol is ENUM_FAKE.protocol
{
	return protocol === ENUM_FAKE.protocol
}

export function isFakeHostname(hostname: string): hostname is ENUM_FAKE.protocol
{
	return hostname === ENUM_FAKE.hostname
}

export default LazyURL
