import type { CollectionName } from './collectionNames';
import type { IBaseDatabase } from '../types';
import BaseRepository from './BaseRepository';
import { DeviceKeyObject, IDeviceKeyRepository } from 'spark-protocol';
declare class DeviceKeyDatabaseRepository extends BaseRepository<DeviceKeyObject> implements IDeviceKeyRepository {
    _database: IBaseDatabase<DeviceKeyObject>;
    _collectionName: CollectionName;
    constructor(database: IBaseDatabase<DeviceKeyObject>);
    create: (arg1: DeviceKeyObject) => Promise<DeviceKeyObject>;
    deleteByID: (deviceID: string) => Promise<void>;
    getAll(): Promise<Array<DeviceKeyObject>>;
    getByID: (deviceID: string) => Promise<DeviceKeyObject | null | undefined>;
    updateByID: (deviceID: string, props: Partial<DeviceKeyObject>) => Promise<DeviceKeyObject>;
}
export default DeviceKeyDatabaseRepository;
