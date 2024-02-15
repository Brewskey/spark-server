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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var path_1 = __importDefault(require("path"));
var settings_1 = __importDefault(require("spark-protocol/dist/settings"));
var SETTINGS = __assign(__assign({}, settings_1.default), { BUILD_DIRECTORY: path_1.default.join(__dirname, '../__test_data__/build'), CUSTOM_FIRMWARE_DIRECTORY: path_1.default.join(__dirname, '../__test_data__'), DEFAULT_ADMIN_PASSWORD: 'adminPassword', DEFAULT_ADMIN_USERNAME: '__admin__', DEVICE_DIRECTORY: path_1.default.join(__dirname, '../__test_data__/deviceKeys'), FIRMWARE_DIRECTORY: path_1.default.join(__dirname, '../__test_data__/knownApps'), FIRMWARE_REPOSITORY_DIRECTORY: path_1.default.join(__dirname, '../__test_data__/firmware'), LOG_LEVEL: process.env.LOG_LEVEL || 'info', SERVER_KEY_FILENAME: 'default_key.pem', SERVER_KEYS_DIRECTORY: path_1.default.join(__dirname, '../__test_data__'), USERS_DIRECTORY: path_1.default.join(__dirname, '../__test_data__/users'), WEBHOOKS_DIRECTORY: path_1.default.join(__dirname, '../__test_data__/webhooks'), ACCESS_TOKEN_LIFETIME: 7776000, API_TIMEOUT: 30000, CRYPTO_ALGORITHM: 'aes-128-cbc', LOGIN_ROUTE: '/oauth/token', EXPRESS_SERVER_CONFIG: {
        PORT: 8080,
        SSL_CERTIFICATE_FILEPATH: null,
        SSL_PRIVATE_KEY_FILEPATH: null,
        USE_SSL: false,
    }, TCP_DEVICE_SERVER_CONFIG: {
        HOST: 'localhost',
        PORT: 5683,
        ENABLE_SYSTEM_FIRWMARE_AUTOUPDATES: true,
    }, DB_CONFIG: {
        PATH: path_1.default.join(__dirname, '../__test_data__/db'),
        DB_TYPE: 'nedb',
    }, WEBHOOK_TEMPLATE_PARAMETERS: {} });
exports.default = SETTINGS;
//# sourceMappingURL=settings.js.map