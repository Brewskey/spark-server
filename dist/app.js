"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var body_parser_1 = __importDefault(require("body-parser"));
var express_1 = __importDefault(require("express"));
var bunyan_middleware_1 = __importDefault(require("bunyan-middleware"));
var cors_1 = __importDefault(require("cors"));
var logger_1 = __importDefault(require("./lib/logger"));
var RouteConfig_1 = __importDefault(require("./RouteConfig"));
var logger = logger_1.default.createModuleLogger(module);
function createApp(container, settings, existingApp) {
    var app = existingApp || (0, express_1.default)();
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
    if (logger.debug()) {
        app.use((0, bunyan_middleware_1.default)({
            headerName: 'X-Request-Id',
            level: 'debug',
            logger: logger,
            logName: 'req_id',
            obscureHeaders: [],
            propertyName: 'reqId',
        }));
        logger.warn('Request logging enabled');
    }
    app.use(body_parser_1.default.json());
    app.use(body_parser_1.default.urlencoded({
        extended: true,
    }));
    app.use((0, cors_1.default)());
    (0, RouteConfig_1.default)(app, container, [
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
    ], settings);
    app.on('close', function () {
        var claimCodeManager = container.constitute('ClaimCodeManager');
        claimCodeManager.onShutdown();
    });
    return app;
}
exports.default = createApp;
//# sourceMappingURL=app.js.map