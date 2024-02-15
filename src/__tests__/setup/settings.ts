import { LogLevel } from 'bunyan';
import path from 'path';
import { Settings } from '../../types';
import settings from 'spark-protocol/dist/settings';

const SETTINGS: Settings & { CUSTOM_FIRMWARE_DIRECTORY: string } = {
  ...settings,
  BUILD_DIRECTORY: path.join(__dirname, '../__test_data__/build'),
  CUSTOM_FIRMWARE_DIRECTORY: path.join(__dirname, '../__test_data__'),
  DEFAULT_ADMIN_PASSWORD: 'adminPassword',
  DEFAULT_ADMIN_USERNAME: '__admin__',
  DEVICE_DIRECTORY: path.join(__dirname, '../__test_data__/deviceKeys'),
  FIRMWARE_DIRECTORY: path.join(__dirname, '../__test_data__/knownApps'),
  FIRMWARE_REPOSITORY_DIRECTORY: path.join(
    __dirname,
    '../__test_data__/firmware',
  ),
  LOG_LEVEL: (process.env.LOG_LEVEL as LogLevel) || 'info',
  SERVER_KEY_FILENAME: 'default_key.pem',
  SERVER_KEYS_DIRECTORY: path.join(__dirname, '../__test_data__'),
  USERS_DIRECTORY: path.join(__dirname, '../__test_data__/users'),
  WEBHOOKS_DIRECTORY: path.join(__dirname, '../__test_data__/webhooks'),

  ACCESS_TOKEN_LIFETIME: 7776000, // 90 days,
  API_TIMEOUT: 30000,
  CRYPTO_ALGORITHM: 'aes-128-cbc',
  LOGIN_ROUTE: '/oauth/token',

  EXPRESS_SERVER_CONFIG: {
    PORT: 8080,
    SSL_CERTIFICATE_FILEPATH: null,
    SSL_PRIVATE_KEY_FILEPATH: null,
    USE_SSL: false,
  },
  TCP_DEVICE_SERVER_CONFIG: {
    HOST: 'localhost',
    PORT: 5683,
    ENABLE_SYSTEM_FIRWMARE_AUTOUPDATES: true,
  },
  DB_CONFIG: {
    PATH: path.join(__dirname, '../__test_data__/db'),
    DB_TYPE: 'nedb' as const,
  },
  WEBHOOK_TEMPLATE_PARAMETERS: {},
};

export default SETTINGS;
