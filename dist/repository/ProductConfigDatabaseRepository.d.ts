import type { CollectionName } from './collectionNames';
import type { IBaseDatabase, IProductConfigRepository, ProductConfig } from '../types';
import BaseRepository from './BaseRepository';
declare class ProductConfigDatabaseRepository extends BaseRepository<ProductConfig> implements IProductConfigRepository {
    _database: IBaseDatabase<ProductConfig>;
    _collectionName: CollectionName;
    constructor(database: IBaseDatabase<ProductConfig>);
    create: (model: Omit<ProductConfig, 'id' | 'created_at'>) => Promise<ProductConfig>;
    deleteByID: (id: string) => Promise<void>;
    getAll: (userID?: string | null | undefined) => Promise<Array<ProductConfig>>;
    getByProductID: (productID: number) => Promise<ProductConfig | null | undefined>;
    getByID: (id: string) => Promise<ProductConfig | null | undefined>;
    updateByID: () => Promise<ProductConfig>;
}
export default ProductConfigDatabaseRepository;
