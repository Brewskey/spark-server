import { DeviceAttributes, Platform } from '@brewskey/spark-protocol';

export type DeviceAPIType = {
  cellular: boolean;
  connected: boolean;
  current_build_target: number | null;
  functions?: Array<string> | null | undefined;
  id: string;
  imei: string | null;
  last_app: string | null | undefined;
  last_heard: Date | null | undefined;
  last_iccid?: string;
  last_ip_address: string | null | undefined;
  name: string;
  platform_id: number;
  product_firmware_version: number;
  product_id: number;
  return_value?: unknown;
  status: string;
  variables: Record<string, unknown> | null | undefined;
};

const DEVICE_DEFAULT: DeviceAttributes = {
  isConnected: false,
  currentBuildTarget: null,
  deviceID: '',
  functions: null,
  imei: '',
  ip: null,
  isCellular: false,
  lastIccid: undefined,
  lastFlashedAppName: null,
  lastHeard: null,
  name: '',
  particleProductId: -1,
  platformId: Platform.CORE,
  productFirmwareVersion: -1,
  variables: {},
  appHash: null,
  claimCode: null,
  ownerID: null,
  registrar: null,
  reservedFlags: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const deviceToAPI = (
  device: DeviceAttributes | null | undefined,
  result?: unknown,
): DeviceAPIType => {
  const mergedDevice = {
    ...DEVICE_DEFAULT,
    ...device,
  } as const;

  return {
    cellular: mergedDevice.isCellular,
    connected: mergedDevice.isConnected || false,
    current_build_target: mergedDevice.currentBuildTarget,
    functions: mergedDevice.functions || null,
    id: mergedDevice.deviceID,
    imei: mergedDevice.imei,
    last_app: mergedDevice.lastFlashedAppName,
    last_heard: mergedDevice.lastHeard,
    last_iccid: mergedDevice.lastIccid,
    last_ip_address: mergedDevice.ip,
    name: mergedDevice.name,
    platform_id: mergedDevice.platformId,
    product_firmware_version: mergedDevice.productFirmwareVersion,
    product_id: mergedDevice.particleProductId,
    return_value: result,
    status: 'normal',
    variables: mergedDevice.variables || null,
  };
};

export default deviceToAPI;
