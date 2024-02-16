import type { DeviceAttributes } from '../types';

import JSONFileManager from './JSONFileManager';

// getByID, deleteByID and update uses model.deviceID as ID for querying
class DeviceAttributeFileRepository {
  _fileManager: JSONFileManager;

  constructor(path: string) {
    this._fileManager = new JSONFileManager(path);
  }

  // eslint-disable-next-line no-unused-vars
  async create(model: DeviceAttributes): Promise<DeviceAttributes> {
    throw new Error('Create device attributes not implemented');
  }

  async updateByID(
    deviceID: string,
    props: Partial<DeviceAttributes>,
  ): Promise<DeviceAttributes> {
    const currentAttributes: DeviceAttributes | null | undefined =
      await this.getByID(deviceID);
    if (!currentAttributes) {
      throw new Error(`Could not find device with ID ${deviceID}`);
    }

    const modelToSave = {
      ...(currentAttributes || {}),
      ...props,
    } as const;

    this._fileManager.writeFile(`${deviceID}.json`, {
      ...modelToSave,
      timestamp: new Date(),
    });
    return modelToSave;
  }

  async deleteByID(deviceID: string) {
    this._fileManager.deleteFile(`${deviceID}.json`);
  }

  async getAll(userID: string | null = null): Promise<Array<DeviceAttributes>> {
    const allData = await this._getAll();

    if (userID) {
      return allData.filter(
        (attributes: DeviceAttributes): boolean =>
          attributes.ownerID === userID,
      );
    }
    return allData;
  }

  async getByID(
    deviceID: string,
  ): Promise<DeviceAttributes | null | undefined> {
    return this._fileManager.getFile(`${deviceID}.json`);
  }

  async getByName(deviceName: string): Promise<DeviceAttributes> {
    const allData = this._getAll();

    const result = allData.find(
      (attributes: DeviceAttributes): boolean => attributes.name === deviceName,
    );

    if (!result) {
      throw new Error(`Missing device ${deviceName}`);
    }

    return result;
  }

  _getAll(): Array<DeviceAttributes> {
    return this._fileManager.getAllData();
  }
}

export default DeviceAttributeFileRepository;
