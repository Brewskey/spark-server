import path from 'path';
import fs from 'fs';
import type { Settings } from './types';
import { LogLevel } from 'bunyan';
import settings from 'spark-protocol/dist/settings';

const SETTINGS_OVERRIDE_PATH = path.join(process.cwd(), 'settings.json');
let settingsOverrides: Partial<Settings> = {};
if (fs.existsSync(SETTINGS_OVERRIDE_PATH)) {
  settingsOverrides = JSON.parse(
    fs.readFileSync(SETTINGS_OVERRIDE_PATH).toString(),
  ) as Settings;
  console.log('Loading settings overrides: ', settingsOverrides);
}

const SETTINGS: Settings = {
  ...settings,
  BUILD_DIRECTORY: path.join(process.cwd(), 'data/build'),
  DEFAULT_ADMIN_PASSWORD: 'adminPassword',
  DEFAULT_ADMIN_USERNAME: '__admin__',
  DEVICE_DIRECTORY: path.join(process.cwd(), 'data/deviceKeys'),
  FIRMWARE_DIRECTORY: path.join(process.cwd(), 'data/knownApps'),
  FIRMWARE_REPOSITORY_DIRECTORY: path.join(process.cwd(), '../spark-firmware'),
  SERVER_KEY_FILENAME: 'default_key.pem',
  SERVER_KEYS_DIRECTORY: path.join(process.cwd(), 'data'),
  USERS_DIRECTORY: path.join(process.cwd(), 'data/users'),
  WEBHOOKS_DIRECTORY: path.join(process.cwd(), 'data/webhooks'),
  ACCESS_TOKEN_LIFETIME: 7776000, // 90 days,
  API_TIMEOUT: 30000, // Timeout for API requests.
  CRYPTO_ALGORITHM: 'aes-128-cbc',
  LOG_LEVEL: (process.env.LOG_LEVEL as unknown as LogLevel) || 'info',
  LOGIN_ROUTE: '/oauth/token',
  EXPRESS_SERVER_CONFIG: {
    PORT: 8080,
    SSL_CERTIFICATE_FILEPATH: null,
    SSL_PRIVATE_KEY_FILEPATH: null,
    USE_SSL: false,
  },
  DB_CONFIG: {
    DB_TYPE: 'nedb',
    PATH: path.join(process.cwd(), 'data/db'),
  },
  SHOW_VERBOSE_DEVICE_LOGS: false,

  TCP_DEVICE_SERVER_CONFIG: {
    HOST: 'localhost',
    PORT: 5683,
    ENABLE_SYSTEM_FIRWMARE_AUTOUPDATES: true,
  },
  // Override template parameters in webhooks with this object
  WEBHOOK_TEMPLATE_PARAMETERS: {
    // SOME_AUTH_TOKEN: '12312312',
  },
  ALLOW_DEVICE_TO_PROVIDE_PEM: true,
  ...settingsOverrides,
};

export default SETTINGS;
