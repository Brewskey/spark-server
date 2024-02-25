import {
  defaultBindings,
  Organization,
  Product,
  ProductConfig,
  User,
  Webhook,
} from '@brewskey/spark-protocol';
import type { Container } from 'constitute';
import ExpressOAuthServer from 'express-oauth-server';
import { DataSource } from 'typeorm';

import DeviceClaimsController from './controllers/DeviceClaimsController';
import DevicesController from './controllers/DevicesController';
import EventsController from './controllers/EventsController';
import EventsControllerV2 from './controllers/EventsControllerV2';
import OauthClientsController from './controllers/OauthClientsController';
import ProductFirmwaresController from './controllers/ProductFirmwaresController';
import ProductFirmwaresControllerV2 from './controllers/ProductFirmwaresControllerV2';
import ProductsController from './controllers/ProductsController';
import ProductsControllerV2 from './controllers/ProductsControllerV2';
import ProvisioningController from './controllers/ProvisioningController';
import UsersController from './controllers/UsersController';
import WebhooksController from './controllers/WebhooksController';
import DeviceManager from './managers/DeviceManager';
import EventManager from './managers/EventManager';
import PermissionManager from './managers/PermissionManager';
import WebhookManager from './managers/WebhookManager';
import OAuthModel from './OAuthModel';
import DeviceFirmwareFileRepository from './repository/DeviceFirmwareFileRepository';
import MongoDb from './repository/MongoDb';
import NeDb from './repository/NeDb';
import OrganizationRepository from './repository/OrganizationRepository';
import ProductConfigRepository from './repository/ProductConfigRepository';
import { ProductRepository } from './repository/ProductRepository';
import UserRepository from './repository/UserRepository';
import WebhookRepository from './repository/WebhookRepository';
import settings from './settings';
import type { Settings } from './types';

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

  // spark protocol container bindings
  defaultBindings(container, {
    BINARIES_DIRECTORY,
    CONNECTED_DEVICES_LOGGING_INTERVAL:
      CONNECTED_DEVICES_LOGGING_INTERVAL || 15000,
    DEVICE_DIRECTORY,
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

  container.bindClass('OAuthModel', OAuthModel, ['UserRepository']);

  container.bindClass('ExpressOAuthServer', ExpressOAuthServer, [
    'OAUTH_SETTINGS',
  ]);

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
    'PermissionManager',
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
    'DeviceAttributeRepository',
    'OrganizationRepository',
    'UserRepository',
    'WebhookRepository',
    'ExpressOAuthServer',
  ]);
  container.bindClass('OauthClientsController', OauthClientsController, []);
  container.bindClass('ProductsController', ProductsController, [
    'DeviceManager',
    'DeviceAttributeRepository',
    'OrganizationRepository',
    'ProductRepository',
    'ProductConfigRepository',
    'ProductDeviceRepository',
    'ProductFirmwareRepository',
  ]);
  container.bindClass('ProductsControllerV2', ProductsControllerV2, [
    'DeviceAttributeRepository',
    'ProductRepository',
    'ProductDeviceRepository',
  ]);
  container.bindClass(
    'ProductFirmwaresController',
    ProductFirmwaresController,
    [
      'DeviceManager',
      'ProductDeviceRepository',
      'ProductFirmwareRepository',
      'ProductRepository',
    ],
  );
  container.bindClass(
    'ProductFirmwaresControllerV2',
    ProductFirmwaresControllerV2,
    [
      'DeviceManager',
      'ProductDeviceRepository',
      'ProductFirmwareRepository',
      'ProductRepository',
    ],
  );
  container.bindClass('ProvisioningController', ProvisioningController, [
    'DeviceManager',
  ]);
  container.bindClass('UsersController', UsersController, ['UserRepository']);
  container.bindClass('WebhooksController', WebhooksController, [
    'WebhookManager',
  ]);

  // managers
  container.bindClass('DeviceManager', DeviceManager, [
    'DeviceAttributeRepository',
    'DeviceFirmwareFileRepository',
    'DeviceKeyObjectRepository',
    'PermissionManager',
    'EventPublisher',
  ]);
  container.bindClass('EventManager', EventManager, ['EventPublisher']);
  container.bindClass('WebhookManager', WebhookManager, [
    'EventPublisher',
    'PermissionManager',
    'WebhookRepository',
  ]);

  // Repositories
  const dataSource = container.constitute<DataSource>('DataSource');
  [
    {
      entity: Organization,
      repository: OrganizationRepository,
      extra: ['User.Repository'],
    },
    {
      entity: Product,
      repository: ProductRepository,
    },
    {
      entity: ProductConfig,
      repository: ProductConfigRepository,
    },
    {
      entity: User,
      repository: UserRepository,
    },
    {
      entity: Webhook,
      repository: WebhookRepository,
    },
  ].forEach(({ entity, repository, extra = [] }) => {
    const repositoryKey = entity.name + '.Repository';
    container.bindValue(repositoryKey, dataSource.getRepository(entity));
    container.bindClass(repository.name, repository, [repositoryKey, ...extra]);
  });

  container.bindClass(
    'DeviceFirmwareFileRepository',
    DeviceFirmwareFileRepository,
    ['FIRMWARE_DIRECTORY'],
  );
};
