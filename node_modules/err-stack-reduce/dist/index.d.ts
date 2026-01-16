export interface IOptions {
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
export declare function errStackReduceCore(mainError: Error, mainOptions?: IOptions): (error: Error, options?: IOptions) => {
    stack: string;
    originalStack: string;
    prefix: string;
    message: string;
    error: Error;
    rawTrace: string[];
    type: string;
};
/**
 * reduce stame stack from sub error with parent error
 *
 * recommend use {@link errStackReduceCore}
 */
export declare function errStackReduce(error: Error, mainError: Error, mainOptions?: IOptions): {
    stack: string;
    originalStack: string;
    prefix: string;
    message: string;
    error: Error;
    rawTrace: string[];
    type: string;
};
export default errStackReduceCore;
