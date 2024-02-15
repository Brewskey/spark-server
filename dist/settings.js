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
var fs_1 = __importDefault(require("fs"));
var settings_1 = __importDefault(require("spark-protocol/dist/settings"));
var SETTINGS_OVERRIDE_PATH = path_1.default.join(process.cwd(), 'settings.json');
var settingsOverrides = {};
if (fs_1.default.existsSync(SETTINGS_OVERRIDE_PATH)) {
    settingsOverrides = JSON.parse(fs_1.default.readFileSync(SETTINGS_OVERRIDE_PATH).toString());
    console.log('Loading settings overrides: ', settingsOverrides);
}
var SETTINGS = __assign(__assign(__assign({}, settings_1.default), { BUILD_DIRECTORY: path_1.default.join(process.cwd(), 'data/build'), DEFAULT_ADMIN_PASSWORD: 'adminPassword', DEFAULT_ADMIN_USERNAME: '__admin__', DEVICE_DIRECTORY: path_1.default.join(process.cwd(), 'data/deviceKeys'), FIRMWARE_DIRECTORY: path_1.default.join(process.cwd(), 'data/knownApps'), FIRMWARE_REPOSITORY_DIRECTORY: path_1.default.join(process.cwd(), '../spark-firmware'), SERVER_KEY_FILENAME: 'default_key.pem', SERVER_KEYS_DIRECTORY: path_1.default.join(process.cwd(), 'data'), USERS_DIRECTORY: path_1.default.join(process.cwd(), 'data/users'), WEBHOOKS_DIRECTORY: path_1.default.join(process.cwd(), 'data/webhooks'), ACCESS_TOKEN_LIFETIME: 7776000, API_TIMEOUT: 30000, CRYPTO_ALGORITHM: 'aes-128-cbc', LOG_LEVEL: process.env.LOG_LEVEL || 'info', LOGIN_ROUTE: '/oauth/token', EXPRESS_SERVER_CONFIG: {
        PORT: 8080,
        SSL_CERTIFICATE_FILEPATH: null,
        SSL_PRIVATE_KEY_FILEPATH: null,
        USE_SSL: false,
    }, DB_CONFIG: {
        DB_TYPE: 'nedb',
        PATH: path_1.default.join(process.cwd(), 'data/db'),
    }, SHOW_VERBOSE_DEVICE_LOGS: false, TCP_DEVICE_SERVER_CONFIG: {
        HOST: 'localhost',
        PORT: 5683,
        ENABLE_SYSTEM_FIRWMARE_AUTOUPDATES: true,
    }, 
    // Override template parameters in webhooks with this object
    WEBHOOK_TEMPLATE_PARAMETERS: {
    // SOME_AUTH_TOKEN: '12312312',
    }, ALLOW_DEVICE_TO_PROVIDE_PEM: true }), settingsOverrides);
exports.default = SETTINGS;
//# sourceMappingURL=settings.js.map