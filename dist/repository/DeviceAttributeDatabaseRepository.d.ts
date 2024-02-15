import type { CollectionName } from './collectionNames';
import type { IBaseDatabase } from '../types';
import BaseRepository from './BaseRepository';
import { DeviceAttributes, IDeviceAttributeRepository, IProductDeviceRepository } from 'spark-protocol';
declare class DeviceAttributeDatabaseRepository extends BaseRepository<DeviceAttributes> implements IDeviceAttributeRepository {
    _database: IBaseDatabase<DeviceAttributes>;
    _collectionName: CollectionName;
    _productDeviceRepository: IProductDeviceRepository;
    constructor(database: IBaseDatabase<DeviceAttributes>, productDeviceRepository: IProductDeviceRepository);
    create: () => Promise<DeviceAttributes>;
    deleteByID: (deviceID: string) => Promise<void>;
    getAll: (userID?: string | null) => Promise<Array<DeviceAttributes>>;
    getByID: (deviceID: string) => Promise<DeviceAttributes | null | undefined>;
    getByName: (name: string) => Promise<DeviceAttributes | undefined>;
    getManyFromIDs: (deviceIDs: Array<string>, ownerID?: string) => Promise<Array<DeviceAttributes>>;
    updateByID: (deviceID: string, attributes: Partial<DeviceAttributes>) => Promise<DeviceAttributes>;
    _parseVariables: (attributesFromDB?: DeviceAttributes | null) => DeviceAttributes | undefined;
}
export default DeviceAttributeDatabaseRepository;
