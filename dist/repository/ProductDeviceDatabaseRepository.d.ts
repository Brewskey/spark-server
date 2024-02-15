import type { CollectionName } from './collectionNames';
import type { IBaseDatabase, ProductDevice } from '../types';
import BaseRepository from './BaseRepository';
import { IProductDeviceRepository } from 'spark-protocol';
declare class ProductDeviceDatabaseRepository extends BaseRepository<ProductDevice> implements IProductDeviceRepository {
    _database: IBaseDatabase<ProductDevice>;
    _collectionName: CollectionName;
    constructor(database: IBaseDatabase<ProductDevice>);
    countByProductID: <TQuery extends Record<string, unknown>>(productID: number, query: TQuery) => Promise<number>;
    create: (model: Omit<ProductDevice, 'id' | 'created_at'>) => Promise<ProductDevice>;
    deleteByID: (id: string) => Promise<void>;
    getAll: (userID?: string | null | undefined) => Promise<Array<ProductDevice>>;
    getAllByProductID: (productID: number, skip: number, take: number) => Promise<Array<ProductDevice>>;
    getManyByProductID: <TQuery extends Record<string, unknown>>(productID: number, query?: TQuery | undefined) => Promise<Array<ProductDevice>>;
    getByID: (id: string) => Promise<ProductDevice | null | undefined>;
    getFromDeviceID: (deviceID: string) => Promise<ProductDevice | null | undefined>;
    getManyFromDeviceIDs: (deviceIDs: Array<string>) => Promise<Array<ProductDevice>>;
    updateByID: (productDeviceID: string, productDevice: ProductDevice) => Promise<ProductDevice>;
    deleteByProductID: (productID: number) => Promise<void>;
}
export default ProductDeviceDatabaseRepository;
