import type { Response as $Response, Request } from 'express';
import type { User } from '../types';
import type { HttpResult } from './types';
export default class Controller {
    request: Request;
    response: $Response;
    user: User;
    bad<TType>(messageOrError: unknown, status?: number): HttpResult<TType>;
    ok<TType>(output?: TType): HttpResult<TType>;
}
