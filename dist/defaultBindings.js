"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var spark_protocol_1 = require("spark-protocol");
var express_oauth_server_1 = __importDefault(require("express-oauth-server"));
var OAuthModel_1 = __importDefault(require("./OAuthModel"));
var DeviceClaimsController_1 = __importDefault(require("./controllers/DeviceClaimsController"));
var DevicesController_1 = __importDefault(require("./controllers/DevicesController"));
var EventsController_1 = __importDefault(require("./controllers/EventsController"));
var EventsControllerV2_1 = __importDefault(require("./controllers/EventsControllerV2"));
var OauthClientsController_1 = __importDefault(require("./controllers/OauthClientsController"));
var ProductsController_1 = __importDefault(require("./controllers/ProductsController"));
var ProductsControllerV2_1 = __importDefault(require("./controllers/ProductsControllerV2"));
var ProductFirmwaresController_1 = __importDefault(require("./controllers/ProductFirmwaresController"));
var ProductFirmwaresControllerV2_1 = __importDefault(require("./controllers/ProductFirmwaresControllerV2"));
var ProvisioningController_1 = __importDefault(require("./controllers/ProvisioningController"));
var UsersController_1 = __importDefault(require("./controllers/UsersController"));
var WebhooksController_1 = __importDefault(require("./controllers/WebhooksController"));
var DeviceManager_1 = __importDefault(require("./managers/DeviceManager"));
var WebhookManager_1 = __importDefault(require("./managers/WebhookManager"));
var EventManager_1 = __importDefault(require("./managers/EventManager"));
var PermissionManager_1 = __importDefault(require("./managers/PermissionManager"));
var DeviceFirmwareFileRepository_1 = __importDefault(require("./repository/DeviceFirmwareFileRepository"));
var NeDb_1 = __importDefault(require("./repository/NeDb"));
var MongoDb_1 = __importDefault(require("./repository/MongoDb"));
var DeviceAttributeDatabaseRepository_1 = __importDefault(require("./repository/DeviceAttributeDatabaseRepository"));
var DeviceKeyDatabaseRepository_1 = __importDefault(require("./repository/DeviceKeyDatabaseRepository"));
var OrganizationDatabaseRepository_1 = __importDefault(require("./repository/OrganizationDatabaseRepository"));
var ProductDatabaseRepository_1 = __importDefault(require("./repository/ProductDatabaseRepository"));
var ProductConfigDatabaseRepository_1 = __importDefault(require("./repository/ProductConfigDatabaseRepository"));
var ProductDeviceDatabaseRepository_1 = __importDefault(require("./repository/ProductDeviceDatabaseRepository"));
var ProductFirmwareDatabaseRepository_1 = __importDefault(require("./repository/ProductFirmwareDatabaseRepository"));
var UserDatabaseRepository_1 = __importDefault(require("./repository/UserDatabaseRepository"));
var WebhookDatabaseRepository_1 = __importDefault(require("./repository/WebhookDatabaseRepository"));
var settings_1 = __importDefault(require("./settings"));
exports.default = (function (container, newSettings) {
    // Make sure that the spark-server settings match whatever is passed in
    Object.keys(newSettings).forEach(function (key) {
        settings_1.default[key] = newSettings[key];
    });
    var BINARIES_DIRECTORY = newSettings.BINARIES_DIRECTORY, CONNECTED_DEVICES_LOGGING_INTERVAL = newSettings.CONNECTED_DEVICES_LOGGING_INTERVAL, DEVICE_DIRECTORY = newSettings.DEVICE_DIRECTORY, SERVER_KEY_FILENAME = newSettings.SERVER_KEY_FILENAME, SERVER_KEY_PASSWORD = newSettings.SERVER_KEY_PASSWORD, SERVER_KEYS_DIRECTORY = newSettings.SERVER_KEYS_DIRECTORY, TCP_DEVICE_SERVER_CONFIG = newSettings.TCP_DEVICE_SERVER_CONFIG;
    var ENABLE_SYSTEM_FIRWMARE_AUTOUPDATES = newSettings.TCP_DEVICE_SERVER_CONFIG.ENABLE_SYSTEM_FIRWMARE_AUTOUPDATES;
    // spark protocol container bindings
    (0, spark_protocol_1.defaultBindings)(container, {
        BINARIES_DIRECTORY: BINARIES_DIRECTORY,
        CONNECTED_DEVICES_LOGGING_INTERVAL: CONNECTED_DEVICES_LOGGING_INTERVAL || 15000,
        DEVICE_DIRECTORY: DEVICE_DIRECTORY,
        ENABLE_SYSTEM_FIRWMARE_AUTOUPDATES: ENABLE_SYSTEM_FIRWMARE_AUTOUPDATES,
        SERVER_KEY_FILENAME: SERVER_KEY_FILENAME,
        SERVER_KEY_PASSWORD: SERVER_KEY_PASSWORD !== null && SERVER_KEY_PASSWORD !== void 0 ? SERVER_KEY_PASSWORD : undefined,
        SERVER_KEYS_DIRECTORY: SERVER_KEYS_DIRECTORY,
        TCP_DEVICE_SERVER_CONFIG: TCP_DEVICE_SERVER_CONFIG,
    });
    // settings
    container.bindValue('DEVICE_DIRECTORY', settings_1.default.DEVICE_DIRECTORY);
    container.bindValue('FIRMWARE_DIRECTORY', settings_1.default.FIRMWARE_DIRECTORY);
    container.bindValue('SERVER_KEY_FILENAME', settings_1.default.SERVER_KEY_FILENAME);
    container.bindValue('SERVER_KEYS_DIRECTORY', settings_1.default.SERVER_KEYS_DIRECTORY);
    container.bindValue('USERS_DIRECTORY', settings_1.default.USERS_DIRECTORY);
    container.bindValue('WEBHOOKS_DIRECTORY', settings_1.default.WEBHOOKS_DIRECTORY);
    container.bindMethod('OAUTH_SETTINGS', function (oauthModel) { return ({
        accessTokenLifetime: settings_1.default.ACCESS_TOKEN_LIFETIME,
        allowBearerTokensInQueryString: true,
        model: oauthModel,
    }); }, ['OAuthModel']);
    container.bindValue('ALLOW_DEVICE_TO_PROVIDE_PEM', settings_1.default.ALLOW_DEVICE_TO_PROVIDE_PEM);
    container.bindClass('OAuthModel', OAuthModel_1.default, ['IUserRepository']);
    container.bindClass('OAuthServer', express_oauth_server_1.default, ['OAUTH_SETTINGS']);
    if (settings_1.default.DB_CONFIG.DB_TYPE === 'mongodb') {
        container.bindValue('DATABASE_URL', settings_1.default.DB_CONFIG.URL);
        container.bindValue('DATABASE_OPTIONS', settings_1.default.DB_CONFIG.OPTIONS);
        container.bindClass('IDatabase', MongoDb_1.default, [
            'DATABASE_URL',
            'DATABASE_OPTIONS',
        ]);
    }
    else {
        container.bindValue('DATABASE_PATH', settings_1.default.DB_CONFIG.PATH);
        container.bindClass('IDatabase', NeDb_1.default, ['DATABASE_PATH']);
    }
    // controllers
    container.bindClass('DeviceClaimsController', DeviceClaimsController_1.default, [
        'DeviceManager',
        'ClaimCodeManager',
    ]);
    container.bindClass('DevicesController', DevicesController_1.default, [
        'DeviceManager',
    ]);
    container.bindClass('EventsController', EventsController_1.default, [
        'EventManager',
        'DeviceManager',
    ]);
    container.bindClass('EventsControllerV2', EventsControllerV2_1.default, [
        'EventManager',
        'DeviceManager',
    ]);
    container.bindClass('PermissionManager', PermissionManager_1.default, [
        'IDeviceAttributeRepository',
        'IOrganizationRepository',
        'IUserRepository',
        'IWebhookRepository',
        'OAuthServer',
    ]);
    container.bindClass('OauthClientsController', OauthClientsController_1.default, []);
    container.bindClass('ProductsController', ProductsController_1.default, [
        'DeviceManager',
        'IDeviceAttributeRepository',
        'IOrganizationRepository',
        'IProductRepository',
        'IProductConfigRepository',
        'IProductDeviceRepository',
        'IProductFirmwareRepository',
    ]);
    container.bindClass('ProductsControllerV2', ProductsControllerV2_1.default, [
        'DeviceManager',
        'IDeviceAttributeRepository',
        'IOrganizationRepository',
        'IProductRepository',
        'IProductConfigRepository',
        'IProductDeviceRepository',
        'IProductFirmwareRepository',
    ]);
    container.bindClass('ProductFirmwaresController', ProductFirmwaresController_1.default, [
        'DeviceManager',
        'IProductDeviceRepository',
        'IProductFirmwareRepository',
        'IProductRepository',
    ]);
    container.bindClass('ProductFirmwaresControllerV2', ProductFirmwaresControllerV2_1.default, [
        'DeviceManager',
        'IProductDeviceRepository',
        'IProductFirmwareRepository',
        'IProductRepository',
    ]);
    container.bindClass('ProvisioningController', ProvisioningController_1.default, [
        'DeviceManager',
    ]);
    container.bindClass('UsersController', UsersController_1.default, ['IUserRepository']);
    container.bindClass('WebhooksController', WebhooksController_1.default, [
        'WebhookManager',
    ]);
    // managers
    container.bindClass('DeviceManager', DeviceManager_1.default, [
        'IDeviceAttributeRepository',
        'IDeviceFirmwareRepository',
        'IDeviceKeyRepository',
        'PermissionManager',
        'EventPublisher',
    ]);
    container.bindClass('EventManager', EventManager_1.default, ['EventPublisher']);
    container.bindClass('WebhookManager', WebhookManager_1.default, [
        'EventPublisher',
        'PermissionManager',
        'IWebhookRepository',
    ]);
    // Repositories
    container.bindClass('IDeviceAttributeRepository', DeviceAttributeDatabaseRepository_1.default, ['IDatabase', 'IProductDeviceRepository']);
    container.bindClass('IDeviceFirmwareRepository', DeviceFirmwareFileRepository_1.default, ['FIRMWARE_DIRECTORY']);
    container.bindClass('IDeviceKeyRepository', DeviceKeyDatabaseRepository_1.default, [
        'IDatabase',
    ]);
    container.bindClass('IOrganizationRepository', OrganizationDatabaseRepository_1.default, ['IDatabase']);
    container.bindClass('IProductRepository', ProductDatabaseRepository_1.default, [
        'IDatabase',
    ]);
    container.bindClass('IProductConfigRepository', ProductConfigDatabaseRepository_1.default, ['IDatabase']);
    container.bindClass('IProductDeviceRepository', ProductDeviceDatabaseRepository_1.default, ['IDatabase']);
    container.bindClass('IProductFirmwareRepository', ProductFirmwareDatabaseRepository_1.default, ['IDatabase']);
    container.bindClass('IUserRepository', UserDatabaseRepository_1.default, ['IDatabase']);
    container.bindClass('IWebhookRepository', WebhookDatabaseRepository_1.default, [
        'IDatabase',
    ]);
});
//# sourceMappingURL=defaultBindings.js.map