const COLLECTION_NAMES = {
  DEVICE_ATTRIBUTES: 'deviceAttributes',
  DEVICE_KEYS: 'deviceKeys',
  ORGANIZATIONS: 'organizations',
  PRODUCT_CONFIGS: 'productConfigs',
  PRODUCT_DEVICES: 'productDevices',
  PRODUCT_FIRMWARE: 'productFirmware',
  PRODUCTS: 'products',
  USERS: 'users',
  WEBHOOKS: 'webhooks',
} as const;

export type CollectionName =
  (typeof COLLECTION_NAMES)[keyof typeof COLLECTION_NAMES];

export default COLLECTION_NAMES;
