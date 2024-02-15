import type { CollectionName } from './collectionNames';
import type { IBaseDatabase } from '../types';

import COLLECTION_NAMES from './collectionNames';
import BaseRepository from './BaseRepository';
import { DeviceKeyObject, IDeviceKeyRepository } from 'spark-protocol';

// getByID, deleteByID and update uses model.deviceID as ID for querying
class DeviceKeyDatabaseRepository
  extends BaseRepository<DeviceKeyObject>
  implements IDeviceKeyRepository
{
  _database: IBaseDatabase<DeviceKeyObject>;

  _collectionName: CollectionName = COLLECTION_NAMES.DEVICE_KEYS;

  constructor(database: IBaseDatabase<DeviceKeyObject>) {
    super(database, COLLECTION_NAMES.DEVICE_KEYS);
    this._database = database;

    this.tryCreateIndex({ deviceID: 1 });
  }

  create: (arg1: DeviceKeyObject) => Promise<DeviceKeyObject> = async (
    model: DeviceKeyObject,
  ): Promise<DeviceKeyObject> =>
    this._database.insertOne(this._collectionName, {
      ...({ _id: model.deviceID.toLowerCase() } as unknown as Record<
        string,
        never
      >),
      ...model,
      deviceID: model.deviceID.toLowerCase(),
    });

  deleteByID: (deviceID: string) => Promise<void> = async (
    deviceID: string,
  ): Promise<void> =>
    this._database.remove(this._collectionName, {
      deviceID: deviceID.toLowerCase(),
    });

  async getAll(): Promise<Array<DeviceKeyObject>> {
    throw new Error('The method is not implemented.');
  }

  getByID: (deviceID: string) => Promise<DeviceKeyObject | null | undefined> =
    async (deviceID: string): Promise<DeviceKeyObject | null | undefined> =>
      this._database.findOne(this._collectionName, {
        deviceID: deviceID.toLowerCase(),
      });

  updateByID: (
    deviceID: string,
    props: Partial<DeviceKeyObject>,
  ) => Promise<DeviceKeyObject> = async (
    deviceID: string,
    props: Partial<DeviceKeyObject>,
  ): Promise<DeviceKeyObject> =>
    this._database.findAndModify(
      this._collectionName,
      { deviceID: deviceID.toLowerCase() },
      { $set: { ...props, deviceID: deviceID.toLowerCase() } },
    );
}

export default DeviceKeyDatabaseRepository;
