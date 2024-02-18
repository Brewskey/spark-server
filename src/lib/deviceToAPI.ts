import { DeviceAttributes } from '@brewskey/spark-protocol';

export type DeviceAPIType = {
  cellular: boolean;
  connected: boolean;
  current_build_target: number;
  functions?: Array<string> | null | undefined;
  id: string;
  imei?: string;
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

const DEVICE_DEFAULT = {
  connected: false,
  current_build_target: -1,
  deviceID: '',
  functions: null,
  imei: '',
  ip: null,
  isCellular: false,
  last_iccid: '',
  lastFlashedAppName: null,
  lastHeard: null,
  name: '',
  particleProductId: -1,
  platformId: -1,
  productFirmwareVersion: -1,
  variables: null,
} as const;

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
    connected: mergedDevice.connected || false,
    current_build_target: parseInt(
      (mergedDevice.currentBuildTarget != null
        ? mergedDevice.currentBuildTarget
        : mergedDevice.current_build_target
      ).toString(),
    ),
    functions: mergedDevice.functions || null,
    id: mergedDevice.deviceID,
    imei: mergedDevice.imei,
    last_app: mergedDevice.lastFlashedAppName,
    last_heard: mergedDevice.lastHeard,
    last_iccid: mergedDevice.last_iccid,
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
