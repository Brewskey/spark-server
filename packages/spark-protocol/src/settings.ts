import { LogLevel } from 'bunyan';
import path from 'path';

export type Settings = {
  BINARIES_DIRECTORY: string;
  DEFAULT_EVENT_TTL: number;
  DEVICE_DIRECTORY: string;
  TCP_DEVICE_SERVER_CONFIG: {
    ENABLE_SYSTEM_FIRWMARE_AUTOUPDATES: boolean;
    HOST: string;
    PORT: number;
  };
  SERVER_KEY_FILENAME: string;
  SERVER_KEY_PASSWORD: string | null | undefined;
  SERVER_KEYS_DIRECTORY: string;
  CRYPTO_ALGORITHM: string;
  LOG_LEVEL: LogLevel;
  KEEP_ALIVE_TIMEOUT: number;
  SOCKET_TIMEOUT: number;
  VERBOSE_PROTOCOL: boolean;
  SHOW_VERBOSE_DEVICE_LOGS: boolean;
  CONNECTED_DEVICES_LOGGING_INTERVAL: number;
  // Sometimes the device keys become corrupted (or you might have forgotten to update the key)
  // This will save the key for the device instead of using CLI to set it.
  ALLOW_DEVICE_TO_PROVIDE_PEM: boolean;
};

const SETTINGS: Settings = {
  BINARIES_DIRECTORY: path.join(process.cwd(), 'data/binaries'),
  DEFAULT_EVENT_TTL: 60,
  DEVICE_DIRECTORY: path.join(process.cwd(), 'data/deviceKeys'),
  TCP_DEVICE_SERVER_CONFIG: {
    ENABLE_SYSTEM_FIRWMARE_AUTOUPDATES: true,
    HOST: 'localhost',
    PORT: 5683,
  },
  SERVER_KEY_FILENAME: 'default_key.pem',
  SERVER_KEY_PASSWORD: null as string | null | undefined,
  SERVER_KEYS_DIRECTORY: path.join(__dirname, '../data/users'),

  CRYPTO_ALGORITHM: 'aes-128-cbc',
  LOG_LEVEL: (process.env.LOG_LEVEL as unknown as LogLevel) || 'info',
  KEEP_ALIVE_TIMEOUT: 20000, // 20 seconds
  SOCKET_TIMEOUT: 31000, // 31 seconds

  VERBOSE_PROTOCOL: false,
  SHOW_VERBOSE_DEVICE_LOGS: false,
  CONNECTED_DEVICES_LOGGING_INTERVAL: 10000,
  ALLOW_DEVICE_TO_PROVIDE_PEM: false,
};

export default SETTINGS;
