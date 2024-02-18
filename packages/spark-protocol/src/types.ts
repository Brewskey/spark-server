import { PlatformType } from 'binary-version-reader';

export type DeviceAttributes = {
  appHash: string | null | undefined;
  claimCode?: string | null | undefined;
  currentBuildTarget?: string;
  deviceID: string;
  functions: Array<string> | null | undefined;
  imei?: string;
  ip: string;
  isCellular?: boolean;
  last_iccid?: string;
  lastFlashedAppName: string | null | undefined;
  lastHeard: Date | null | undefined;
  name: string;
  ownerID: string | null | undefined;
  particleProductId: number;
  platformId: PlatformType;
  productFirmwareVersion: number;
  registrar?: string | null | undefined;
  variables: Record<string, string> | null | undefined;
  reservedFlags: number | null | undefined;
  timestamp: Date;
  connected: boolean;
};

export type DeviceKeyObject = {
  algorithm: 'ecc' | 'rsa';
  deviceID: string;
  key: string;
};

export type ProtocolEvent<TEventContextData> = EventData<TEventContextData> & {
  broadcasted?: boolean;
  publishedAt: Date;
  isPublic: boolean;
  isInternal: boolean;
};

export type FunctionEventContext = {
  responseEventName: string;
  deviceID: string;
  functionArguments: Record<string, string>;
  functionName: string;
};

export type FlashEventContext = {
  deviceID: string;
  fileBuffer: Buffer;
  responseEventName: string;
  fileName: string;
  productID: number;
};
export type AttributesEventContext = {
  deviceID: string;
  responseEventName: string;
  attributes: DeviceAttributes;
};
export type VariableEventContext = {
  deviceID: string;
  responseEventName: string;
  variableName: string;
};
export type PingEventContext = {
  deviceID: string;
  responseEventName: string;
};
export type ShouldShowSignalEventContext = {
  deviceID: string;
  responseEventName: string;
  shouldShowSignal: boolean;
};
export type ResultEventContext = {
  result: string | number | boolean | Buffer | null | undefined;
};

export type EventData<TContextData> = {
  connectionID?: string | null | undefined;
  context?: TContextData;
  data?: string | null | undefined;
  deviceID?: string | null | undefined;
  name: string;
  ttl?: number;
  userID?: string;
};

export type ServerKeyRepository = {
  createKeys: (
    privateKeyPem: Buffer,
    publicKeyPem: Buffer,
  ) => Promise<{
    privateKeyPem: Buffer;
    publicKeyPem: Buffer;
  }>;
  getPrivateKey: () => Promise<string | null | undefined>;
};

export type ProductFirmware = {
  current: boolean;
  data: Buffer;
  description: string;
  device_count: number;
  id: string;
  name: string;
  product_id: number;
  size: number;
  title: string;
  updated_at: Date;
  version: number;
};

export type ProductDevice = {
  denied: boolean;
  development: boolean;
  deviceID: string;
  id: string;
  lockedFirmwareVersion: number | null | undefined;
  notes: string;
  productID: number;
  quarantined: boolean;
  productFirmwareVersion: number;
};

export type PublishOptions = {
  isInternal?: boolean;
  isPublic?: boolean;
};

export interface IBaseRepository<TModel> {
  count(...filters: Array<unknown>): Promise<number>;
  create(model: TModel | Partial<TModel>): Promise<TModel>;
  deleteByID(id: string | number): Promise<void>;
  getAll(userID?: string | null | undefined): Promise<Array<TModel>>;
  getByID(id: string | number): Promise<TModel | null | undefined>;
  updateByID(id: string | number, props: Partial<TModel>): Promise<TModel>;
}

export interface IDeviceAttributeRepository
  extends IBaseRepository<DeviceAttributes> {
  getByName(deviceName: string): Promise<DeviceAttributes | undefined>;
  getManyFromIDs(
    deviceIDs: Array<string>,
    ownerID?: string,
  ): Promise<Array<DeviceAttributes>>;
}

export interface IDeviceKeyRepository
  extends IBaseRepository<DeviceKeyObject> {}

export interface IProductDeviceRepository
  extends IBaseRepository<ProductDevice> {
  getAllByProductID(
    productID: number,
    page: number,
    perPage: number,
  ): Promise<Array<ProductDevice>>;
  countByProductID(
    productID: number,
    query?: Record<string, unknown>,
  ): Promise<number>;
  getFromDeviceID(deviceID: string): Promise<ProductDevice | null | undefined>;
  getManyByProductID(
    productID: number,
    query?: Record<string, unknown>,
  ): Promise<Array<ProductDevice>>;
  getManyFromDeviceIDs(deviceIDs: Array<string>): Promise<Array<ProductDevice>>;
  deleteByProductID(productID: number): Promise<void>;
  getFromDeviceID(deviceID: string): Promise<ProductDevice | null | undefined>;
}

export interface IProductFirmwareRepository
  extends IBaseRepository<ProductFirmware> {
  getAllByProductID(productID: number): Promise<Array<ProductFirmware>>;
  getByVersionForProduct(
    productID: number,
    version: number,
  ): Promise<ProductFirmware | null | undefined>;
  getCurrentForProduct(
    productID: number,
  ): Promise<ProductFirmware | null | undefined>;
  countByProductID(
    productID: number,
    query?: Record<string, unknown>,
  ): Promise<number>;
  getManyByProductID(
    productID: number,
    query?: Record<string, unknown>,
  ): Promise<Array<ProductFirmware>>;
  getByVersionForProduct(
    productID: number,
    version: number,
  ): Promise<ProductFirmware | null | undefined>;
  getCurrentForProduct(
    productID: number,
  ): Promise<ProductFirmware | null | undefined>;
  deleteByProductID(productID: number): Promise<void>;
}
