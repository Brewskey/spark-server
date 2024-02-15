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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
var constitute_1 = require("constitute");
var fs_1 = __importDefault(require("fs"));
var http_1 = __importDefault(require("http"));
var https_1 = __importDefault(require("https"));
var os_1 = __importDefault(require("os"));
var spark_protocol_1 = require("spark-protocol");
var app_1 = __importDefault(require("./app"));
var defaultBindings_1 = __importDefault(require("./defaultBindings"));
var settings_1 = __importDefault(require("./settings"));
var logger_1 = __importDefault(require("./lib/logger"));
var nullthrows_1 = __importDefault(require("nullthrows"));
var logger = logger_1.default.createModuleLogger(module);
var NODE_PORT = process.env.NODE_PORT || settings_1.default.EXPRESS_SERVER_CONFIG.PORT;
process.on('uncaughtException', function (exception) {
    logger.error({ err: exception }, 'uncaughtException');
    process.exit(1); // exit with failure
});
/* This is the container used app-wide for dependency injection. If you want to
 * override any of the implementations, create your module with the new
 * implementation and use:
 *
 * container.bindAlias(DefaultImplementation, MyNewImplementation);
 *
 * You can also set a new value
 * container.bindAlias(DefaultValue, 12345);
 *
 * See https://github.com/justmoon/constitute for more info
 */
var container = new constitute_1.Container();
(0, defaultBindings_1.default)(container, settings_1.default);
var deviceServer = container.constitute('DeviceServer');
deviceServer.start();
var app = (0, app_1.default)(container, settings_1.default);
var onServerStartListen = function () {
    logger.info({ port: NODE_PORT }, 'Express server started, with events');
};
var _c = settings_1.default.EXPRESS_SERVER_CONFIG, privateKeyFilePath = _c.SSL_PRIVATE_KEY_FILEPATH, certificateFilePath = _c.SSL_CERTIFICATE_FILEPATH, useSSL = _c.USE_SSL, expressConfig = __rest(_c, ["SSL_PRIVATE_KEY_FILEPATH", "SSL_CERTIFICATE_FILEPATH", "USE_SSL"]);
if (useSSL) {
    logger.debug({ cert: certificateFilePath, key: privateKeyFilePath }, 'Use SSL');
    var options = __assign({ cert: (_a = (certificateFilePath &&
            fs_1.default.readFileSync((0, nullthrows_1.default)(certificateFilePath)))) !== null && _a !== void 0 ? _a : undefined, key: (_b = (privateKeyFilePath && fs_1.default.readFileSync((0, nullthrows_1.default)(privateKeyFilePath)))) !== null && _b !== void 0 ? _b : undefined }, expressConfig);
    https_1.default.createServer(options, app).listen(NODE_PORT, onServerStartListen);
}
else {
    http_1.default.createServer(app).listen(NODE_PORT, onServerStartListen);
}
var addresses = Object.entries(os_1.default.networkInterfaces())
    .map(function (_a) {
    var _name = _a[0], nic = _a[1];
    return nic === null || nic === void 0 ? void 0 : nic.filter(function (address) {
        return address.family === 'IPv4' && address.address !== '127.0.0.1';
    }).map(function (address) { return address.address; });
})
    .filter(spark_protocol_1.filterFalsyValues)
    .flat();
addresses.forEach(function (address) {
    return logger.info({ address: address }, 'Server IP address found');
});
//# sourceMappingURL=main.js.map