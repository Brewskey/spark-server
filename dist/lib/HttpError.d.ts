declare class HttpError extends Error {
    status: number;
    constructor(error: string | Error | HttpError, status?: number);
}
export default HttpError;
