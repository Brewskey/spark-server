import path from 'path';

type ConfigType = {
  BUILD_DIRECTORY: string,
  DEFAULT_ADMIN_PASSWORD: string,
  DEFAULT_ADMIN_USERNAME: string,
  DEVICE_DIRECTORY: string,
  ENABLE_SYSTEM_FIRWMARE_AUTOUPDATES: boolean,
  FIRMWARE_DIRECTORY: string,
  FIRMWARE_REPOSITORY_DIRECTORY: string,
  SERVER_KEY_FILENAME: string,
  SERVER_KEYS_DIRECTORY: string,
  USERS_DIRECTORY: string,
  WEBHOOKS_DIRECTORY: string,
  ACCESS_TOKEN_LIFETIME: number,
  API_TIMEOUT: number,
  CRYPTO_ALGORITHM: string,
  LOG_REQUESTS: boolean,
  LOGIN_ROUTE: string,
  EXPRESS_SERVER_CONFIG: {
    PORT: number,
    SSL_CERTIFICATE_FILEPATH: string | null,
    SSL_PRIVATE_KEY_FILEPATH: string | null,
    USE_SSL: boolean
  },
  DB_CONFIG: {
    OPTIONS: any,
    URL: string
  },
  SHOW_VERBOSE_DEVICE_LOGS: boolean,
  TCP_DEVICE_SERVER_CONFIG: {
    HOST: string,
    PORT: number
  },
  WEBHOOK_TEMPLATE_PARAMETERS: any
};

const CONFIG: ConfigType = {
  BUILD_DIRECTORY: path.join(__dirname, '../data/build'),
  DEFAULT_ADMIN_PASSWORD: 'adminPassword',
  DEFAULT_ADMIN_USERNAME: '__admin__',
  DEVICE_DIRECTORY: path.join(__dirname, '../data/deviceKeys'),
  ENABLE_SYSTEM_FIRWMARE_AUTOUPDATES: true,
  FIRMWARE_DIRECTORY: path.join(__dirname, '../data/knownApps'),
  FIRMWARE_REPOSITORY_DIRECTORY: path.join(__dirname, '../../spark-firmware'),
  SERVER_KEY_FILENAME: 'default_key.pem',
  SERVER_KEYS_DIRECTORY: path.join(__dirname, '../data'),
  USERS_DIRECTORY: path.join(__dirname, '../data/users'),
  WEBHOOKS_DIRECTORY: path.join(__dirname, '../data/webhooks'),
  ACCESS_TOKEN_LIFETIME: 7776000, // 90 days,
  API_TIMEOUT: 30000, // Timeout for API requests.
  CRYPTO_ALGORITHM: 'aes-128-cbc',
  LOG_REQUESTS: true,
  LOGIN_ROUTE: '/oauth/token',
  EXPRESS_SERVER_CONFIG: {
    PORT: 8080,
    SSL_CERTIFICATE_FILEPATH: null,
    SSL_PRIVATE_KEY_FILEPATH: null,
    USE_SSL: false,
  },
  DB_CONFIG: {
    OPTIONS: {
      // here you can pass any options, which MongoClient.connect() accepts
      // retry to connect for 60 times
      reconnectTries: 60,
      // wait 1 second before retrying
      reconnectInterval: 1000,
    },
    // you have to provide mongo connection URL here
    URL: 'mongodb://host:impFJimWwvAJ59u8E...',
  },
  SHOW_VERBOSE_DEVICE_LOGS: false,

  TCP_DEVICE_SERVER_CONFIG: {
    HOST: 'localhost',
    PORT: 5683,
  },
  // Override template parameters in webhooks with this object
  WEBHOOK_TEMPLATE_PARAMETERS: {
    // SOME_AUTH_TOKEN: '12312312',
  },
};

export default CONFIG;
