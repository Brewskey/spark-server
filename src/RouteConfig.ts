import type {
  Application as $Application,
  Response as $Response,
  Request,
  RequestHandler,
  NextFunction,
} from 'express';
import type { Container } from 'constitute';
import nullthrows from 'nullthrows';
import multer, { Field } from 'multer';
import HttpError from './lib/HttpError';
import { IUserRepository, type Settings } from './types';
import Logger from './lib/logger';
import OAuthServer from 'express-oauth-server';
import Controller from './controllers/Controller';

const logger = Logger.createModuleLogger(module);

const maybe =
  (
    middleware: (req: Request, res: $Response, next: NextFunction) => unknown,
    condition: boolean,
  ): RequestHandler =>
  (request: Request, response: $Response, next: NextFunction): void => {
    if (condition) {
      middleware(request, response, next);
    } else {
      next();
    }
  };

const injectUserMiddleware =
  (container: Container): RequestHandler =>
  (request: Request, response: $Response, next: NextFunction) => {
    const oauthInfo = response.locals.oauth;
    if (oauthInfo) {
      const { token } = oauthInfo;
      const user = token && token.user;
      // eslint-disable-next-line no-param-reassign
      (request as unknown as { user: Record<string, unknown> }).user = user;
      container
        .constitute<IUserRepository>('IUserRepository')
        .setCurrentUser(user);
    }
    next();
  };

const serverSentEventsMiddleware =
  (): ((req: Request, res: $Response, next: NextFunction) => unknown) =>
  (request: Request, response: $Response, next: NextFunction) => {
    request.socket.setNoDelay();
    response.writeHead(200, {
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Content-Type': 'text/event-stream',
      'X-Accel-Buffering': 'no',
    });

    next();
  };

export default (
  app: $Application,
  container: Container,
  controllers: Array<string>,
  settings: Settings,
) => {
  const filesMiddleware = (
    allowedUploads: Field[] = [],
  ): ((req: Request, res: $Response, next: NextFunction) => unknown) =>
    nullthrows(allowedUploads).length
      ? multer().fields(allowedUploads)
      : multer().any();

  const oauth = container.constitute<OAuthServer>('OAuthServer');

  app.post(settings.LOGIN_ROUTE, oauth.token());

  controllers.forEach(
    <
      TControllerType extends Record<
        string,
        // eslint-disable-next-line @typescript-eslint/ban-types
        Function & {
          allowedUploads: Field[];
          anonymous: boolean;
          httpVerb:
            | 'get'
            | 'post'
            | 'put'
            | 'delete'
            | 'patch'
            | 'options'
            | 'head';
          route: string;
          serverSentEvents: boolean;
        }
      >,
    >(
      controllerName: string,
    ) => {
      const controller = container.constitute<Controller & TControllerType>(
        controllerName,
      );
      Object.getOwnPropertyNames(Object.getPrototypeOf(controller)).forEach(
        (functionName: keyof TControllerType) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mappedFunction = controller[functionName];
          const {
            allowedUploads,
            anonymous,
            httpVerb,
            route,
            serverSentEvents,
          } = mappedFunction;

          if (!httpVerb) {
            return;
          }

          app[httpVerb](
            route,
            maybe(oauth.authenticate(), !anonymous),
            maybe(serverSentEventsMiddleware(), serverSentEvents),
            injectUserMiddleware(container),
            maybe(filesMiddleware(allowedUploads), allowedUploads?.length != 0),
            async (request: Request, response: $Response) => {
              const argumentNames = (route.match(/:[\w]*/g) || []).map(
                (argumentName: string): string => argumentName.replace(':', ''),
              );
              const values = argumentNames.map(
                (argument: string): string => request.params[argument],
              );

              let controllerInstance =
                container.constitute<Controller>(controllerName);

              // In order parallel requests on the controller, the state
              // (request/response/user) must be added to the controller.
              if (controllerInstance === controller) {
                // throw new Error(
                //   '`Transient.with` must be used when binding controllers',
                // );
                controllerInstance = Object.create(controllerInstance);
              }

              controllerInstance.request = request;
              controllerInstance.response = response;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              controllerInstance.user = (request as any).user;

              // Take access token out if it's posted.
              const { access_token: _accessToken, ...body } = request.body;

              try {
                (allowedUploads || []).forEach(({ maxCount, name }: Field) => {
                  if (!name || !request.files) {
                    return;
                  }
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const file = (request.files as any)[name];
                  if (!file) {
                    return;
                  }
                  body[name] = maxCount === 1 ? file[0] : file;
                });

                const functionResult = mappedFunction.call(
                  controllerInstance,
                  ...values,
                  body,
                );

                // For SSE routes we don't return a result
                if (serverSentEvents) {
                  return;
                }

                if (functionResult.then) {
                  const result = await functionResult;

                  response
                    .status(nullthrows(result).status)
                    .json(nullthrows(result).data);
                } else {
                  response
                    .status(functionResult.status)
                    .json(functionResult.data);
                }
              } catch (error) {
                logger.error(error);
                const httpError = new HttpError(
                  error as unknown as string | Error | HttpError,
                );
                response.status(httpError.status).json({
                  error: httpError.message,
                  ok: false,
                });
              }
            },
          );
        },
      );
    },
  );

  app.all('*', (_: Request, response: $Response) => {
    response.sendStatus(404);
  });

  app.use(
    (
      error: Error | HttpError,
      _request: Request,
      response: $Response,
      // eslint-disable-next-line no-unused-vars
      _next: NextFunction,
    ): void => {
      response.status(400).json({
        error: error instanceof HttpError ? error.message : error,
        ok: false,
      });
    },
  );
};
