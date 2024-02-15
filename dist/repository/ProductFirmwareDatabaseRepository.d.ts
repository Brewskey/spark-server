import type { CollectionName } from './collectionNames';
import type { IBaseDatabase } from '../types';
import BaseRepository from './BaseRepository';
import { IProductFirmwareRepository, ProductFirmware } from 'spark-protocol';
declare class ProductFirmwareDatabaseRepository extends BaseRepository<ProductFirmware> implements IProductFirmwareRepository {
    _database: IBaseDatabase<ProductFirmware>;
    _collectionName: CollectionName;
    constructor(database: IBaseDatabase<ProductFirmware>);
    countByProductID: <TQuery extends Record<string, unknown>>(productID: number, query: TQuery) => Promise<number>;
    create: (model: Omit<ProductFirmware, 'id' | 'created_at'>) => Promise<ProductFirmware>;
    deleteByID: (id: string) => Promise<void>;
    getAll: (userID?: string | null | undefined) => Promise<Array<ProductFirmware>>;
    getManyByProductID: <TQuery extends Record<string, unknown>>(productID: number, query?: TQuery | undefined) => Promise<Array<ProductFirmware>>;
    getAllByProductID(productID: number): Promise<ProductFirmware[]>;
    getByVersionForProduct: (productID: number, version: number) => Promise<ProductFirmware | null | undefined>;
    getCurrentForProduct: (productID: number) => Promise<ProductFirmware | null | undefined>;
    getByID: (id: string) => Promise<ProductFirmware | null | undefined>;
    updateByID: (productFirmwareID: string, productFirmware: ProductFirmware) => Promise<ProductFirmware>;
    deleteByProductID: (productID: number) => Promise<void>;
}
export default ProductFirmwareDatabaseRepository;
