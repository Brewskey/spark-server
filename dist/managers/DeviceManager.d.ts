/// <reference types="multer" />
import type { DeviceAttributes, EventPublisher, IDeviceAttributeRepository, IDeviceKeyRepository } from 'spark-protocol';
import type PermissionManager from './PermissionManager';
import type { IDeviceFirmwareRepository } from '../types';
declare class DeviceManager {
    _deviceAttributeRepository: IDeviceAttributeRepository;
    _deviceFirmwareRepository: IDeviceFirmwareRepository;
    _deviceKeyRepository: IDeviceKeyRepository;
    _permissionManager: PermissionManager;
    _eventPublisher: EventPublisher;
    constructor(deviceAttributeRepository: IDeviceAttributeRepository, deviceFirmwareRepository: IDeviceFirmwareRepository, deviceKeyRepository: IDeviceKeyRepository, permissionManager: PermissionManager, eventPublisher: EventPublisher);
    claimDevice(deviceID: string, userID: string): Promise<DeviceAttributes>;
    unclaimDevice(deviceID: string): Promise<DeviceAttributes>;
    getAttributesByID(deviceID: string): Promise<DeviceAttributes>;
    getByID(deviceID: string): Promise<DeviceAttributes>;
    getDeviceID(deviceIDorName: string): Promise<string>;
    getAll(): Promise<Array<DeviceAttributes>>;
    callFunction<TResult>(deviceID: string, functionName: string, functionArguments: Record<string, string>): Promise<TResult>;
    getVariableValue<TResult>(deviceID: string, variableName: string): Promise<TResult>;
    forceFirmwareUpdate(deviceID: string): Promise<void>;
    flashBinary(deviceID: string, file: Express.Multer.File): Promise<{
        status: number;
    }>;
    flashKnownApp(deviceID: string, appName: string): Promise<{
        status: number;
    }>;
    flashProductFirmware(productID: number, deviceID?: string | null): void;
    ping(deviceID: string): Promise<{
        error?: Error | undefined;
    }>;
    provision(deviceID: string, userID: string, publicKey: string, algorithm: 'ecc' | 'rsa'): Promise<DeviceAttributes>;
    raiseYourHand(deviceID: string, shouldShowSignal: boolean): Promise<void>;
    renameDevice(deviceID: string, name: string): Promise<DeviceAttributes>;
}
export default DeviceManager;
