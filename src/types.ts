import type { Settings as ProtocolSettings } from '@brewskey/spark-protocol';

export type MutateWebhookDTO = {
  id?: number;
  auth?: {
    password: string;
    username: string;
  };
  organizationID?: number;
  deviceID?: string;
  errorResponseTopic?: string;
  event: string;
  form?: Record<string, unknown>;
  headers?: Record<string, string>;
  json?: Record<string, unknown>;
  mydevices?: boolean;
  noDefaults?: boolean;
  ownerID: number;
  productIdOrSlug?: string;
  query?: Record<string, unknown>;
  rejectUnauthorized?: boolean;
  requestType: string;
  responseTemplate?: string;
  responseTopic?: string;
  url: string;
};

export type RequestType = 'DELETE' | 'GET' | 'POST' | 'PUT';

export type Client = {
  clientId: string;
  clientSecret: string;
  grants: Array<GrantType>;
};

export type GrantType = 'bearer_token' | 'password' | 'refresh_token';

export type UserCredentials = {
  username: string;
  password: string;
};

export type ProtectedEntityName = 'deviceAttributes' | 'webhook';

export type Settings = ProtocolSettings & {
  ACCESS_TOKEN_LIFETIME: number;
  API_TIMEOUT: number;
  BUILD_DIRECTORY: string;
  DB_CONFIG: {
    DB_TYPE: 'nedb' | 'mongodb';
    OPTIONS?: Record<string, string>;
    PATH?: string;
    URL?: string;
  };
  DEFAULT_ADMIN_PASSWORD: string;
  DEFAULT_ADMIN_USERNAME: string;
  EXPRESS_SERVER_CONFIG: {
    PORT: number;
    SSL_CERTIFICATE_FILEPATH: string | null | undefined;
    SSL_PRIVATE_KEY_FILEPATH: string | null | undefined;
    USE_SSL: boolean;
  };
  FIRMWARE_DIRECTORY: string;
  FIRMWARE_REPOSITORY_DIRECTORY: string;
  LOGIN_ROUTE: string;
  USERS_DIRECTORY: string;
  WEBHOOK_TEMPLATE_PARAMETERS: Record<string, string>;
  WEBHOOKS_DIRECTORY: string;
};

export type RequestOptions = {
  auth?: {
    password: string;
    username: string;
  };
  body: Record<string, string> | null | undefined;
  form: Record<string, string> | null | undefined | string | null | undefined;
  headers: Record<string, string> | null | undefined;
  json: boolean;
  method: RequestType;
  qs: Record<string, string> | null | undefined;
  strictSSL?: boolean;
  url: string;
};
