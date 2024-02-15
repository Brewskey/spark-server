"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
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
    app.use((0, bunyan_middleware_1.default)({
        headerName: 'X-Request-Id',
        level: 'debug',
        logger: logger,
        logName: 'req_id',
        obscureHeaders: ['authorization'],
        propertyName: 'reqId',
    }));
    app.use(function (req, res, next) {
        var buffers = [];
        var proxyHandler = {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            apply: function (target, thisArg, argumentsList) {
                var contentType = res.getHeader('content-type');
                if (typeof contentType === 'string' &&
                    contentType.includes('json') &&
                    argumentsList[0]) {
                    buffers.push(argumentsList[0]);
                }
                return target.call.apply(target, __spreadArray([thisArg], argumentsList, false));
            },
        };
        res.write = new Proxy(res.write, proxyHandler);
        res.end = new Proxy(res.end, proxyHandler);
        res.on('finish', function () {
            var bodyResponse = Buffer.concat(buffers).toString('utf8');
            try {
                bodyResponse = JSON.parse(bodyResponse);
            }
            catch (_) {
                /* intentionally ignore */
            }
            var headers = __assign({}, req.headers);
            if (headers.authorization) {
                headers.authorization = 'Bearer <removed>';
            }
            req.log.info({
                msg: 'Request',
                url: req.url,
                method: req.method,
                bodyRequest: req.body,
                statusCode: res.statusCode,
                bodyResponse: bodyResponse,
                headers: headers,
            });
        });
        next();
    });
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