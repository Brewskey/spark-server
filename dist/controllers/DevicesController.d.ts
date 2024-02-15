/// <reference types="node" />
/// <reference types="multer" />
import type DeviceManager from '../managers/DeviceManager';
import type { DeviceAPIType } from '../lib/deviceToAPI';
import Controller from './Controller';
import { CompilationResponse } from '../managers/FirmwareCompilationManager';
import { HttpResult } from './types';
type CompileConfig = {
    platform_id?: string;
    product_id?: string;
};
declare class DevicesController extends Controller {
    _deviceManager: DeviceManager;
    constructor(deviceManager: DeviceManager);
    claimDevice(postBody: {
        id: string;
    }): Promise<HttpResult<{
        ok: boolean;
    }>>;
    getAppFirmware(binaryID: string): Promise<HttpResult<Buffer | null | undefined>>;
    compileSources(postBody: CompileConfig): Promise<HttpResult<CompilationResponse>>;
    unclaimDevice(deviceIDorName: string): Promise<HttpResult<{
        ok: boolean;
    }>>;
    getDevices(): Promise<HttpResult<DeviceAPIType[]>>;
    getDevice(deviceIDorName: string): Promise<HttpResult<DeviceAPIType>>;
    getVariableValue(deviceIDorName: string, varName: string): Promise<HttpResult<{
        result: unknown;
    }>>;
    updateDevice(deviceIDorName: string, postBody: {
        app_id?: string;
        file?: Express.Multer.File;
        file_type?: 'binary';
        name?: string;
        signal?: '1' | '0';
    }): Promise<HttpResult<{
        name: string;
        ok: true;
    } | {
        id: string;
        ok: true;
    } | {
        id: string;
        status: number;
    }>>;
    callDeviceFunction(deviceIDorName: string, functionName: string, postBody: Record<string, string>): Promise<HttpResult<DeviceAPIType>>;
    pingDevice(deviceIDorName: string): Promise<HttpResult<{
        error?: Error | undefined;
    }>>;
}
export default DevicesController;
