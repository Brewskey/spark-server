import { IndexSpecification } from 'mongodb';
import { IBaseRepository } from 'spark-protocol';
import type { Settings as ProtocolSettings } from 'spark-protocol/dist/settings';

export type Webhook = {
  auth?: {
    password: string;
    username: string;
  };
  created_at: Date;
  deviceID?: string;
  errorResponseTopic?: string;
  event: string;
  form?: Record<string, unknown>;
  headers?: {
    [key: string]: string;
  };
  id: string;
  json?: Record<string, unknown>;
  mydevices?: boolean;
  noDefaults?: boolean;
  ownerID: string;
  productIdOrSlug?: string | number;
  query?: Record<string, unknown>;
  rejectUnauthorized?: boolean;
  requestType: string;
  responseTemplate?: string;
  responseTopic?: string;
  url: string;
};

export type WebhookMutator = {
  auth?: {
    password: string;
    username: string;
  };
  deviceID?: string;
  errorResponseTopic?: string;
  event: string;
  form?: Record<string, unknown>;
  headers?: Record<string, string>;
  json?: Record<string, unknown>;
  mydevices?: boolean;
  noDefaults?: boolean;
  ownerID: string;
  productIdOrSlug?: string;
  query?: Record<string, unknown>;
  rejectUnauthorized?: boolean;
  requestType: string;
  responseTemplate?: string;
  responseTopic?: string;
  url: string;
  id?: string;
};

export type RequestType = 'DELETE' | 'GET' | 'POST' | 'PUT';

export type Client = {
  clientId: string;
  clientSecret: string;
  grants: Array<GrantType>;
};

export type GrantType = 'bearer_token' | 'password' | 'refresh_token';

export type TokenObject = {
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken?: string;
  refreshTokenExpiresAt?: Date;
  scope?: string;
};

export type User = {
  accessTokens: Array<TokenObject>;
  created_at: Date;
  id: string;
  passwordHash: string;
  role: UserRole | null | undefined;
  salt: string;
  username: string;
};

export type UserCredentials = {
  username: string;
  password: string;
};

export type UserRole = 'administrator';

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

export type PlatformType = // Core

    | 0 // Photon
    | 6 // P1
    | 8 // Electron
    | 10 // Argon
    | 12 // Boron
    | 13 // Xenon
    | 14 // RaspberryPI
    | 31 // Duo
    | 88
    | 103; // Bluz

export type Product = {
  config_id: string;
  description: string;
  hardware_version: string;
  id: number; // This should always be swapped out with product_id when sent to the client,
  latest_firmware_version: number;
  name: string;
  organization: string;
  platform_id: PlatformType;
  product_id: number;
  slug: string;
  type: 'Consumer' | 'Hobbyist' | 'Industrial';
};

export type Organization = {
  id: string;
  name: string;
  user_ids: Array<string>;
};

export type ProductConfig = {
  id: string;
  org_id: string;
  product_id: number;
};

export type ProductDevice = {
  denied: boolean;
  development: boolean;
  deviceID: string;
  id: string;
  lockedFirmwareVersion: number | null | undefined;
  notes: string;
  productFirmwareVersion: number;
  productID: number;
  quarantined: boolean;
};

// export interface IBaseRepository<TModel, TKey = string> {
//   count(...filters: Array<unknown>): Promise<number>;
//   create(model: Partial<TModel>): Promise<TModel>;
//   deleteByID(id: TKey): Promise<void>;
//   getAll(): Promise<Array<TModel>>;
//   getByID(id: TKey): Promise<TModel | null | undefined>;
//   updateByID(id: TKey, props: Partial<TModel>): Promise<TModel>;
// }

export interface IWebhookRepository extends IBaseRepository<Webhook> {}

export interface IProductRepository extends IBaseRepository<Product> {
  getByIDOrSlug(
    productIDOrSlug: string | number,
  ): Promise<Product | null | undefined>;
  getMany(
    userID?: string | null | undefined,
    query?: Record<string, unknown>,
  ): Promise<Array<Product>>;
}

export interface IProductConfigRepository
  extends IBaseRepository<ProductConfig> {
  getByProductID(productID: number): Promise<ProductConfig | null | undefined>;
}

// export interface IProductDeviceRepository
//   extends IBaseRepository<ProductDevice> {
//   countByProductID(
//     productID: number,
//     query?: Record<string, unknown>,
//   ): Promise<number>;
//   getFromDeviceID(deviceID: string): Promise<ProductDevice | null | undefined>;
//   getManyByProductID(
//     productID: number,
//     query?: Record<string, unknown>,
//   ): Promise<Array<ProductDevice>>;
//   getManyFromDeviceIDs(deviceIDs: Array<string>): Promise<Array<ProductDevice>>;
//   deleteByProductID(productID: number): Promise<void>;
// }

// export interface IProductFirmwareRepository
//   extends IBaseRepository<ProductFirmware> {
//   countByProductID(
//     productID: number,
//     query?: Record<string, unknown>,
//   ): Promise<number>;
//   getManyByProductID(
//     productID: number,
//     query?: Record<string, unknown>,
//   ): Promise<Array<ProductFirmware>>;
//   getByVersionForProduct(
//     productID: number,
//     version: number,
//   ): Promise<ProductFirmware | null | undefined>;
//   getCurrentForProduct(
//     productID: number,
//   ): Promise<ProductFirmware | null | undefined>;
//   deleteByProductID(productID: number): Promise<void>;
// }

export interface IOrganizationRepository extends IBaseRepository<Organization> {
  getByUserID(userID: string): Promise<Array<Organization>>;
}

// export interface IDeviceAttributeRepository
//   extends IBaseRepository<DeviceAttributes> {
//   getByName(deviceName: string): Promise<DeviceAttributes | null | undefined>;
//   getManyFromIDs(
//     deviceIDs: Array<string>,
//     ownerID?: string,
//   ): Promise<Array<DeviceAttributes>>;
// }

// export interface IDeviceKeyRepository
//   extends IBaseRepository<DeviceKeyObject> {}

export interface IUserRepository extends IBaseRepository<User> {
  createWithCredentials(
    credentials: UserCredentials,
    userRole?: UserRole | null | undefined,
  ): Promise<User>;
  deleteAccessToken(userID: string, accessToken: string): Promise<User>;
  getByAccessToken(accessToken: string): Promise<User | null | undefined>;
  getByUsername(username: string): Promise<User | null | undefined>;
  getCurrentUser(): User;
  isUserNameInUse(username: string): Promise<boolean>;
  saveAccessToken(userID: string, tokenObject: TokenObject): Promise<User>;
  setCurrentUser(user: User): void;
  validateLogin(username: string, password: string): Promise<User>;
}

export interface IDeviceFirmwareRepository {
  getByName(appName: string): Buffer | null | undefined;
}

export interface IBaseDatabase<TEntity> {
  count<TQuery extends Record<string, unknown>>(
    collectionName: string,
    query?: TQuery,
  ): Promise<number>;
  find<TQuery extends Record<string, unknown>>(
    collectionName: string,
    query: TQuery,
  ): Promise<TEntity[]>;
  findAndModify(
    collectionName: string,
    query: Record<string, unknown>,
    updateQuery: Record<string, unknown>,
  ): Promise<TEntity>;
  findOne(
    collectionName: string,
    query: Record<string, unknown>,
  ): Promise<TEntity | undefined>;
  insertOne(
    collectionName: string,
    query: Omit<TEntity, 'id' | 'created_at'>,
  ): Promise<TEntity>;
  remove(collectionName: string, query: Record<string, unknown>): Promise<void>;
  tryCreateIndex(
    collectionName: string,
    index: IndexSpecification,
  ): Promise<void>;
}
