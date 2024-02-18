import type { Response as $Response, Request } from 'express';
import type { User } from '../types';
import type { HttpResult } from './types';

export default class Controller {
  request!: Request;

  response!: $Response;

  user!: User;

  bad<TType>(messageOrError: unknown, status: number = 400): HttpResult<TType> {
    let message = '';
    if (messageOrError instanceof Error) {
      message = messageOrError.message;
    } else if (typeof messageOrError === 'string') {
      message = messageOrError;
    } else {
      message = JSON.stringify(messageOrError);
    }
    return {
      data: {
        error: message,
        ok: false,
      },
      status,
    };
  }

  ok<TType>(output?: TType): HttpResult<TType> {
    return {
      data: output,
      status: 200,
    };
  }
}
