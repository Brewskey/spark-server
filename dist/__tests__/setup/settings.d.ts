import { LogLevel } from 'bunyan';
declare const SETTINGS: {
    BUILD_DIRECTORY: string;
    CUSTOM_FIRMWARE_DIRECTORY: string;
    DEFAULT_ADMIN_PASSWORD: string;
    DEFAULT_ADMIN_USERNAME: string;
    DEVICE_DIRECTORY: string;
    ENABLE_SYSTEM_FIRWMARE_AUTOUPDATES: boolean;
    FIRMWARE_DIRECTORY: string;
    FIRMWARE_REPOSITORY_DIRECTORY: string;
    LOG_LEVEL: LogLevel;
    SERVER_KEY_FILENAME: string;
    SERVER_KEYS_DIRECTORY: string;
    USERS_DIRECTORY: string;
    WEBHOOKS_DIRECTORY: string;
    ACCESS_TOKEN_LIFETIME: number;
    API_TIMEOUT: number;
    CRYPTO_ALGORITHM: string;
    LOG_REQUESTS: boolean;
    LOGIN_ROUTE: string;
    EXPRESS_SERVER_CONFIG: {
        PORT: number;
        SSL_CERTIFICATE_FILEPATH: null;
        SSL_PRIVATE_KEY_FILEPATH: null;
        USE_SSL: boolean;
    };
    TCP_DEVICE_SERVER_CONFIG: {
        HOST: string;
        PORT: number;
    };
    DB_CONFIG: {
        PATH: string;
        DB_TYPE: "nedb";
    };
    WEBHOOK_TEMPLATE_PARAMETERS: {};
};
export default SETTINGS;
