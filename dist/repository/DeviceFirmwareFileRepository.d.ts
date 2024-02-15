/// <reference types="node" />
import { FileManager } from 'spark-protocol';
import type { IDeviceFirmwareRepository } from '../types';
declare class DeviceFirmwareFileRepository implements IDeviceFirmwareRepository {
    _fileManager: FileManager;
    constructor(path: string);
    getByName(appName: string): Buffer | null | undefined;
}
export default DeviceFirmwareFileRepository;
