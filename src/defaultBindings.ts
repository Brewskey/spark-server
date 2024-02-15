import type { Container } from 'constitute';
import { defaultBindings } from 'spark-protocol';
import OAuthServer from 'express-oauth-server';
import type { Settings } from './types';
import OAuthModel from './OAuthModel';
import DeviceClaimsController from './controllers/DeviceClaimsController';
import DevicesController from './controllers/DevicesController';
import EventsController from './controllers/EventsController';
import EventsControllerV2 from './controllers/EventsControllerV2';
import OauthClientsController from './controllers/OauthClientsController';
import ProductsController from './controllers/ProductsController';
import ProductsControllerV2 from './controllers/ProductsControllerV2';
import ProductFirmwaresController from './controllers/ProductFirmwaresController';
import ProductFirmwaresControllerV2 from './controllers/ProductFirmwaresControllerV2';
import ProvisioningController from './controllers/ProvisioningController';
import UsersController from './controllers/UsersController';
import WebhooksController from './controllers/WebhooksController';
import DeviceManager from './managers/DeviceManager';
import WebhookManager from './managers/WebhookManager';
import EventManager from './managers/EventManager';
import PermissionManager from './managers/PermissionManager';
import DeviceFirmwareFileRepository from './repository/DeviceFirmwareFileRepository';
import NeDb from './repository/NeDb';
import MongoDb from './repository/MongoDb';
import DeviceAttributeDatabaseRepository from './repository/DeviceAttributeDatabaseRepository';
import DeviceKeyDatabaseRepository from './repository/DeviceKeyDatabaseRepository';
import OrganizationDatabaseRepository from './repository/OrganizationDatabaseRepository';
import ProductDatabaseRepository from './repository/ProductDatabaseRepository';
import ProductConfigDatabaseRepository from './repository/ProductConfigDatabaseRepository';
import ProductDeviceDatabaseRepository from './repository/ProductDeviceDatabaseRepository';
import ProductFirmwareDatabaseRepository from './repository/ProductFirmwareDatabaseRepository';
import UserDatabaseRepository from './repository/UserDatabaseRepository';
import WebhookDatabaseRepository from './repository/WebhookDatabaseRepository';
import settings from './settings';

export default <TSettings extends Settings>(
  container: Container,
  newSettings: TSettings,
) => {
  // Make sure that the spark-server settings match whatever is passed in
  Object.keys(newSettings).forEach(
    <TKey extends keyof Settings>(key: unknown) => {
      settings[key as TKey] = newSettings[key as TKey];
    },
  );

  const {
    BINARIES_DIRECTORY,
    CONNECTED_DEVICES_LOGGING_INTERVAL,
    DEVICE_DIRECTORY,
    SERVER_KEY_FILENAME,
    SERVER_KEY_PASSWORD,
    SERVER_KEYS_DIRECTORY,
    TCP_DEVICE_SERVER_CONFIG,
  } = newSettings;

  const { ENABLE_SYSTEM_FIRWMARE_AUTOUPDATES } =
    newSettings.TCP_DEVICE_SERVER_CONFIG;

  // spark protocol container bindings
  defaultBindings(container, {
    BINARIES_DIRECTORY,
    CONNECTED_DEVICES_LOGGING_INTERVAL:
      CONNECTED_DEVICES_LOGGING_INTERVAL || 15000,
    DEVICE_DIRECTORY,
    ENABLE_SYSTEM_FIRWMARE_AUTOUPDATES,
    SERVER_KEY_FILENAME,
    SERVER_KEY_PASSWORD: SERVER_KEY_PASSWORD ?? undefined,
    SERVER_KEYS_DIRECTORY,
    TCP_DEVICE_SERVER_CONFIG,
  });

  // settings
  container.bindValue('DEVICE_DIRECTORY', settings.DEVICE_DIRECTORY);
  container.bindValue('FIRMWARE_DIRECTORY', settings.FIRMWARE_DIRECTORY);
  container.bindValue('SERVER_KEY_FILENAME', settings.SERVER_KEY_FILENAME);
  container.bindValue('SERVER_KEYS_DIRECTORY', settings.SERVER_KEYS_DIRECTORY);
  container.bindValue('USERS_DIRECTORY', settings.USERS_DIRECTORY);
  container.bindValue('WEBHOOKS_DIRECTORY', settings.WEBHOOKS_DIRECTORY);
  container.bindMethod(
    'OAUTH_SETTINGS',
    (
      oauthModel: OAuthModel,
    ): {
      accessTokenLifetime: number;
      allowBearerTokensInQueryString: boolean;
      model: OAuthModel;
    } => ({
      accessTokenLifetime: settings.ACCESS_TOKEN_LIFETIME,
      allowBearerTokensInQueryString: true,
      model: oauthModel,
    }),
    ['OAuthModel'],
  );
  container.bindValue(
    'ALLOW_DEVICE_TO_PROVIDE_PEM',
    settings.ALLOW_DEVICE_TO_PROVIDE_PEM,
  );

  container.bindClass('OAuthModel', OAuthModel, ['IUserRepository']);

  container.bindClass('OAuthServer', OAuthServer, ['OAUTH_SETTINGS']);

  if (settings.DB_CONFIG.DB_TYPE === 'mongodb') {
    container.bindValue('DATABASE_URL', settings.DB_CONFIG.URL);
    container.bindValue('DATABASE_OPTIONS', settings.DB_CONFIG.OPTIONS);
    container.bindClass('IDatabase', MongoDb, [
      'DATABASE_URL',
      'DATABASE_OPTIONS',
    ]);
  } else {
    container.bindValue('DATABASE_PATH', settings.DB_CONFIG.PATH);
    container.bindClass('IDatabase', NeDb, ['DATABASE_PATH']);
  }

  // controllers
  container.bindClass('DeviceClaimsController', DeviceClaimsController, [
    'DeviceManager',
    'ClaimCodeManager',
  ]);
  container.bindClass('DevicesController', DevicesController, [
    'DeviceManager',
  ]);
  container.bindClass('EventsController', EventsController, [
    'EventManager',
    'DeviceManager',
  ]);
  container.bindClass('EventsControllerV2', EventsControllerV2, [
    'EventManager',
    'DeviceManager',
  ]);
  container.bindClass('PermissionManager', PermissionManager, [
    'IDeviceAttributeRepository',
    'IOrganizationRepository',
    'IUserRepository',
    'IWebhookRepository',
    'OAuthServer',
  ]);
  container.bindClass('OauthClientsController', OauthClientsController, []);
  container.bindClass('ProductsController', ProductsController, [
    'DeviceManager',
    'IDeviceAttributeRepository',
    'IOrganizationRepository',
    'IProductRepository',
    'IProductConfigRepository',
    'IProductDeviceRepository',
    'IProductFirmwareRepository',
  ]);
  container.bindClass('ProductsControllerV2', ProductsControllerV2, [
    'DeviceManager',
    'IDeviceAttributeRepository',
    'IOrganizationRepository',
    'IProductRepository',
    'IProductConfigRepository',
    'IProductDeviceRepository',
    'IProductFirmwareRepository',
  ]);
  container.bindClass(
    'ProductFirmwaresController',
    ProductFirmwaresController,
    [
      'DeviceManager',
      'IProductDeviceRepository',
      'IProductFirmwareRepository',
      'IProductRepository',
    ],
  );
  container.bindClass(
    'ProductFirmwaresControllerV2',
    ProductFirmwaresControllerV2,
    [
      'DeviceManager',
      'IProductDeviceRepository',
      'IProductFirmwareRepository',
      'IProductRepository',
    ],
  );
  container.bindClass('ProvisioningController', ProvisioningController, [
    'DeviceManager',
  ]);
  container.bindClass('UsersController', UsersController, ['IUserRepository']);
  container.bindClass('WebhooksController', WebhooksController, [
    'WebhookManager',
  ]);

  // managers
  container.bindClass('DeviceManager', DeviceManager, [
    'IDeviceAttributeRepository',
    'IDeviceFirmwareRepository',
    'IDeviceKeyRepository',
    'PermissionManager',
    'EventPublisher',
  ]);
  container.bindClass('EventManager', EventManager, ['EventPublisher']);
  container.bindClass('WebhookManager', WebhookManager, [
    'EventPublisher',
    'PermissionManager',
    'IWebhookRepository',
  ]);

  // Repositories
  container.bindClass(
    'IDeviceAttributeRepository',
    DeviceAttributeDatabaseRepository,
    ['IDatabase', 'IProductDeviceRepository'],
  );
  container.bindClass(
    'IDeviceFirmwareRepository',
    DeviceFirmwareFileRepository,
    ['FIRMWARE_DIRECTORY'],
  );
  container.bindClass('IDeviceKeyRepository', DeviceKeyDatabaseRepository, [
    'IDatabase',
  ]);
  container.bindClass(
    'IOrganizationRepository',
    OrganizationDatabaseRepository,
    ['IDatabase'],
  );
  container.bindClass('IProductRepository', ProductDatabaseRepository, [
    'IDatabase',
  ]);
  container.bindClass(
    'IProductConfigRepository',
    ProductConfigDatabaseRepository,
    ['IDatabase'],
  );
  container.bindClass(
    'IProductDeviceRepository',
    ProductDeviceDatabaseRepository,
    ['IDatabase'],
  );
  container.bindClass(
    'IProductFirmwareRepository',
    ProductFirmwareDatabaseRepository,
    ['IDatabase'],
  );

  container.bindClass('IUserRepository', UserDatabaseRepository, ['IDatabase']);
  container.bindClass('IWebhookRepository', WebhookDatabaseRepository, [
    'IDatabase',
  ]);
};
