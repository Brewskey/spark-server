import type {
  Application as $Application,
  Application,
  NextFunction,
  Request,
  Response,
} from 'express';
import type { Container } from 'constitute';
import bodyParser from 'body-parser';
import express from 'express';
import bunyanMiddleware from 'bunyan-middleware';
import cors from 'cors';
import type { Settings } from './types';
import Logger from './lib/logger';
import routeConfig from './RouteConfig';
import { ClaimCodeManager } from 'spark-protocol';

const logger = Logger.createModuleLogger(module);

function createApp<TApplication extends Application>(
  container: Container,
  settings: Settings,
  existingApp?: TApplication,
): $Application {
  const app = existingApp || express();

  // const setCORSHeaders: Middleware<Request, $Response> = (
  //   request: Request,
  //   response: $Response,
  //   next: NextFunction,
  // ): mixed => {
  //   if (request.method === 'OPTIONS') {
  //     response.set({
  //       'Access-Control-Allow-Headers':
  //         'X-Requested-With, Content-Type, Accept, Authorization',
  //       'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  //       'Access-Control-Allow-Origin': '*',
  //       'Access-Control-Max-Age': '300',
  //     });
  //     return response.sendStatus(204);
  //   }
  //   response.set({
  //     'Access-Control-Allow-Origin': '*',
  //   });
  //   return next();
  // };

  app.use(
    bunyanMiddleware({
      headerName: 'X-Request-Id',
      level: 'debug',
      logger,
      logName: 'req_id',
      obscureHeaders: ['authorization'],
      propertyName: 'reqId',
    }),
  );
  app.use((req: Request, res: Response, next: NextFunction) => {
    const buffers: Buffer[] = [];
    const proxyHandler = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      apply<TFunc extends (...p: any[]) => any>(
        target: TFunc,
        thisArg: unknown,
        argumentsList: unknown[],
      ) {
        const contentType = res.getHeader('content-type');
        if (
          typeof contentType === 'string' &&
          contentType.includes('json') &&
          argumentsList[0]
        ) {
          buffers.push(argumentsList[0] as unknown as Buffer);
        }
        return target.call(thisArg, ...argumentsList);
      },
    };
    res.write = new Proxy(res.write, proxyHandler);
    res.end = new Proxy(res.end, proxyHandler);
    res.on('finish', () => {
      let bodyResponse = Buffer.concat(buffers).toString('utf8');
      try {
        bodyResponse = JSON.parse(bodyResponse);
      } catch (_) {
        /* intentionally ignore */
      }

      const headers = { ...req.headers };
      if (headers.authorization) {
        headers.authorization = 'Bearer <removed>';
      }
      req.log.info({
        msg: 'Request',
        url: req.url,
        method: req.method,
        bodyRequest: req.body,
        statusCode: res.statusCode,
        bodyResponse,
        headers,
      });
    });
    next();
  });

  app.use(bodyParser.json());
  app.use(
    bodyParser.urlencoded({
      extended: true,
    }),
  );
  app.use(cors());

  routeConfig(
    app,
    container,
    [
      'DeviceClaimsController',
      // to avoid routes collisions EventsController should be placed
      // before DevicesController
      'EventsController',
      'EventsControllerV2',
      'DevicesController',
      'OauthClientsController',
      'ProductsController',
      'ProductsControllerV2',
      'ProductFirmwaresController',
      'ProductFirmwaresControllerV2',
      'ProvisioningController',
      'UsersController',
      'WebhooksController',
    ],
    settings,
  );

  app.on('close', () => {
    const claimCodeManager =
      container.constitute<ClaimCodeManager>('ClaimCodeManager');
    claimCodeManager.onShutdown();
  });

  return app;
}

export default createApp;
