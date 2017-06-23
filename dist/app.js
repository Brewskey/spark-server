'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _logger = require('./lib/logger');

var _logger2 = _interopRequireDefault(_logger);

var _RouteConfig = require('./RouteConfig');

var _RouteConfig2 = _interopRequireDefault(_RouteConfig);

var _bunyanMiddleware = require('bunyan-middleware');

var _bunyanMiddleware2 = _interopRequireDefault(_bunyanMiddleware);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var logger = _logger2.default.createModuleLogger(module);

exports.default = function (container, settings, existingApp) {
  var app = existingApp || (0, _express2.default)();

  var setCORSHeaders = function setCORSHeaders(request, response, next) {
    if (request.method === 'OPTIONS') {
      response.set({
        'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type, Accept, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Max-Age': '300'
      });
      return response.sendStatus(204);
    }
    response.set({
      'Access-Control-Allow-Origin': '*'
    });
    return next();
  };

  if (settings.LOG_REQUESTS) {
<<<<<<< HEAD
<<<<<<< 3175cdd3571f91ce76ceadb1edf36fb89e2d5d21
<<<<<<< ed7ce9c23565a440fe875df037353fd5f4330b0d
    app.use((0, _morgan2.default)('[:date[iso]] :remote-addr - :remote-user ":method :url ' + 'HTTP/:http-version" :status :res[content-length] ":referrer" ' + '":user-agent"'));
=======
    logger.warn('Request logging enabled');
    if (!logger.debug()) logger.warn('Request will not log, cause Bunyan loglevel is different!');
=======
=======
>>>>>>> 0b5a636a4e3e56c2f813df9fb1670df13e2d4c95
    if (logger.debug()) {
      logger.warn('Request logging enabled');
    } else {
      logger.warn('Request will not log, cause Bunyan loglevel is different!');
    }
<<<<<<< HEAD
>>>>>>> added Requested Changes
=======
>>>>>>> 0b5a636a4e3e56c2f813df9fb1670df13e2d4c95
    var useLogger = logger;
    app.use((0, _bunyanMiddleware2.default)({
      headerName: 'X-Request-Id',
      level: 'debug',
      logger: useLogger,
      logName: 'req_id',
      obscureHeaders: [],
      propertyName: 'reqId'
    }));
<<<<<<< HEAD
>>>>>>> added correct handle of loglevel to bunyan-middleware
=======
>>>>>>> 0b5a636a4e3e56c2f813df9fb1670df13e2d4c95
  }

  app.use(_bodyParser2.default.json());
  app.use(_bodyParser2.default.urlencoded({
    extended: true
  }));
  app.use(setCORSHeaders);

  (0, _RouteConfig2.default)(app, container, ['DeviceClaimsController',
  // to avoid routes collisions EventsController should be placed
  // before DevicesController
  'EventsController', 'DevicesController', 'OauthClientsController', 'ProductsController', 'ProvisioningController', 'UsersController', 'WebhooksController'], settings);

  return app;
};