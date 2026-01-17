import { Options as IIndentOptions } from 'indent-string';
import { IOptions as IErrStackReduceOptions } from 'err-stack-reduce';
export interface IOptions<T = any> {
    error?: Error;
    handleStack?(stack: string, error: T): string;
    /**
     * @default 4
     */
    indent?: number;
    /**
     * options for `indent-string`
     */
    indentOptions?: IIndentOptions;
    stackReduceOptions?: IErrStackReduceOptions;
}
export type IIterableLike<T = any> = Iterable<T> | IterableIterator<T>;
export type IIterableAllowed<T, A extends IIterableLike<T>> = Exclude<A, string | String>;
export declare function _isAllowedIterable(arr: any): boolean;
export declare function errorsToMessageList<T, A extends IIterableLike<T> = IIterableLike<T>>(errors: IIterableAllowed<T, A>, options?: IOptions<T>, mainError?: Error): string[];
export declare function indentSubErrorMessage(sub_message: string | IIterableLike<string>, options?: IOptions): string;
export declare function indentSubErrors<T, A extends IIterableLike<T> = IIterableLike<T>>(errors: IIterableAllowed<T, A>, options?: IOptions<T>, mainError?: Error): string;
export declare function indentSubErrorsFromError<T, A extends IIterableLike<T> = IIterableLike<T>>(mainError?: Error, options?: IOptions<T>): string;
export declare function messageWithSubErrors<T, A extends IIterableLike<T> = IIterableLike<T>>(mainError: Error, errors?: IIterableAllowed<T, A>, options?: IOptions<T>): string;
export default messageWithSubErrors;
