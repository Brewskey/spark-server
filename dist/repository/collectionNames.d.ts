declare const COLLECTION_NAMES: {
    readonly DEVICE_ATTRIBUTES: "deviceAttributes";
    readonly DEVICE_KEYS: "deviceKeys";
    readonly ORGANIZATIONS: "organizations";
    readonly PRODUCT_CONFIGS: "productConfigs";
    readonly PRODUCT_DEVICES: "productDevices";
    readonly PRODUCT_FIRMWARE: "productFirmware";
    readonly PRODUCTS: "products";
    readonly USERS: "users";
    readonly WEBHOOKS: "webhooks";
};
export type CollectionName = (typeof COLLECTION_NAMES)[keyof typeof COLLECTION_NAMES];
export default COLLECTION_NAMES;
