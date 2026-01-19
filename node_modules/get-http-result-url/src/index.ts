import { LazyURL } from 'lazy-url';
import type { ClientRequest } from 'http';
import { LazyURLSearchParams } from 'http-form-urlencoded';

export interface IReqInfo
{
	protocol?: string
	auth?: string
	hostname?: string
	port?: string
	pathname?: string
	search?: string
}

export interface IOptions
{
	ignoreError?: boolean
	response?: any
}

export function resultToURL<T extends {
	request?: any;
}>(result: T, options?: IOptions, res?: any)
{
	return requestToURL(result?.request, options, res ?? options?.response ?? result)
}

export function requestToURL(req: any, options?: IOptions, res?: any)
{
	try
	{
		return new LazyURL(req.url ?? req.res?.responseUrl ?? _requestToURL(req, res ?? options?.response))
	}
	catch (e)
	{
		if (!options?.ignoreError)
		{
			throw e
		}
	}
}

export function _requestToURL(req: any, res: any)
{
	let href: string | URL = req._currentUrl;
	let _currentRequest: ClientRequest = req._currentRequest ?? req ?? {};
	let _options: IReqInfo = req._options ?? {};
	res ??= {};

	if (_options.protocol?.length)
	{
		let u: LazyURL;

		if (_options.protocol && _options.hostname)
		{
			u = new LazyURL(_options.protocol + '//' + _options.hostname);
		}
		else
		{
			u = new LazyURL(_currentRequest.path);
		}

		u.set('protocol', _options.protocol ?? _currentRequest.protocol);
		u.set('port', _options.port);
		u.set('pathname', _options.pathname ?? _currentRequest.path);
		u.set('query', _options.search);
		u.set('auth', _options.auth);
		u.set('hostname', _options.hostname ?? _currentRequest.getHeader?.('Host') as string ?? _currentRequest.host);

		href = u;
	}
	else if (typeof _currentRequest.getHeader === 'function')
	{
		let u = new LazyURL(req.protocol + '//' + _currentRequest.getHeader('Host') ?? _currentRequest.host);

		u.pathname = req.path;
		u.protocol = req.protocol;

		href = u;
	}
	else if (!href && res.config?.url)
	{
		href = new LazyURL(res.config.url, res.config.baseURL);

		if (typeof res.config.params !== 'undefined')
		{
			let sp = new LazyURLSearchParams(res.config.params);
			sp.forEach((value, key) => {
				(href as LazyURL).searchParams.set(key, value);
			})
		}
	}

	return new LazyURL(href)
}

export default requestToURL
