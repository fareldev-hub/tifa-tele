import { ITSPickExtra, ITSRequiredPick } from 'ts-type/lib/type/record';
import { IParsed } from 'error-stack2';
export interface IErrStackMeta<E extends Error> extends ITSRequiredPick<IParsed, 'rawTrace' | 'type'> {
    prefix: string;
    message: string;
    stack: string;
    error: E;
}
export declare function errStackMeta<E extends Error>(error: E): IErrStackMeta<E>;
export declare function stringifyStackMeta(meta: ITSPickExtra<IErrStackMeta<any>, 'prefix' | 'message'>, stack?: string): string;
export default errStackMeta;
