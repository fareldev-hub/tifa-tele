import { LazyURL } from 'lazy-url';
export interface IReqInfo {
    protocol?: string;
    auth?: string;
    hostname?: string;
    port?: string;
    pathname?: string;
    search?: string;
}
export interface IOptions {
    ignoreError?: boolean;
    response?: any;
}
export declare function resultToURL<T extends {
    request?: any;
}>(result: T, options?: IOptions, res?: any): LazyURL;
export declare function requestToURL(req: any, options?: IOptions, res?: any): LazyURL;
export declare function _requestToURL(req: any, res: any): LazyURL;
export default requestToURL;
