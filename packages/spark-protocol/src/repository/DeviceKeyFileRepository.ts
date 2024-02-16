import type { DeviceKeyObject, IDeviceKeyRepository } from '../types';

import FileManager from './FileManager';

const FILE_EXTENSION = '.pub.pem';

// getByID, deleteByID and update uses model.deviceID as ID for querying
class DeviceKeyFileRepository implements IDeviceKeyRepository {
  _fileManager: FileManager;

  constructor(path: string) {
    this._fileManager = new FileManager(path);
  }

  count(..._filters: unknown[]): Promise<number> {
    throw new Error('Method not implemented.');
  }

  async create(model: DeviceKeyObject): Promise<DeviceKeyObject> {
    this._fileManager.createFile(model.deviceID + FILE_EXTENSION, model.key);
    return model;
  }

  async deleteByID(deviceID: string) {
    this._fileManager.deleteFile(deviceID + FILE_EXTENSION);
  }

  // eslint-disable-next-line
  async getAll(): Promise<Array<DeviceKeyObject>> {
    throw new Error('the method is not implemented');
  }

  async getByID(deviceID: string): Promise<DeviceKeyObject | null | undefined> {
    const key = this._fileManager.getFile(deviceID + FILE_EXTENSION);
    return key ? { algorithm: 'rsa', deviceID, key } : null;
  }

  async updateByID(
    deviceID: string,
    props: { key: string },
  ): Promise<DeviceKeyObject> {
    const { key } = props;
    this._fileManager.writeFile(deviceID + FILE_EXTENSION, key);
    return { algorithm: 'rsa', deviceID, key };
  }
}

export default DeviceKeyFileRepository;
