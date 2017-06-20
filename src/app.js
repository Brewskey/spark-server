// @flow

import type {
  $Application,
  $Request,
  $Response,
  Middleware,
  NextFunction,
} from 'express';
import type {
  Container,
} from 'constitute';
import type {
  Settings,
} from './types';

import bodyParser from 'body-parser';
import express from 'express';
import Logger from './lib/logger';
const logger = Logger.createModuleLogger(module);
import routeConfig from './RouteConfig';
import bunyanMiddleware from 'bunyan-middleware';

export default (
  container: Container,
  settings: Settings,
  existingApp ? : express$Application,
): $Application => {
  const app = existingApp || express();

  const setCORSHeaders: Middleware = (
    request: $Request,
    response: $Response,
    next: NextFunction,
  ): mixed => {
    if (request.method === 'OPTIONS') {
      response.set({
        'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type, Accept, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Max-Age': '300',
      });
      return response.sendStatus(204);
    }
    response.set({
      'Access-Control-Allow-Origin': '*',
    });
    return next();
  };

  if (settings.LOG_REQUESTS) {
    logger.warn('Request logging enabled');
    if (!logger.debug()) logger.warn('Request will not log, cause Bunyan loglevel is different!');
    const useLogger = logger;
    app.use(bunyanMiddleware({
      headerName: 'X-Request-Id',
      level: 'debug',
      logger: useLogger,
      logName: 'req_id',
      obscureHeaders: [],
      propertyName: 'reqId',
    }));
  }

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: true,
  }));
  app.use(setCORSHeaders);

  routeConfig(
    app,
    container, [
      'DeviceClaimsController',
      // to avoid routes collisions EventsController should be placed
      // before DevicesController
      'EventsController',
      'DevicesController',
      'OauthClientsController',
      'ProductsController',
      'ProvisioningController',
      'UsersController',
      'WebhooksController',
    ],
    settings,
  );

  return app;
};
