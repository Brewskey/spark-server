import type { CollectionName } from './collectionNames';
import type { IBaseDatabase, IProductRepository, Product } from '../types';
import BaseRepository from './BaseRepository';
declare class ProductDatabaseRepository extends BaseRepository<Product> implements IProductRepository {
    _database: IBaseDatabase<Product>;
    _collectionName: CollectionName;
    constructor(database: IBaseDatabase<Product>);
    create: (model: Omit<Product, 'id' | 'created_at'>) => Promise<Product>;
    deleteByID: (id: number) => Promise<void>;
    getMany: <TQuery extends Record<string, unknown>>(userID?: string | null, query?: TQuery | undefined) => Promise<Array<Product>>;
    getAll: (userID?: string | null | undefined) => Promise<Array<Product>>;
    getByID: (id: number) => Promise<Product | null | undefined>;
    getByIDOrSlug: (productIDOrSlug: string | number) => Promise<Product | null | undefined>;
    updateByID: (id: number, product: Product) => Promise<Product>;
    _formatProduct: (product: Product | Omit<Product, 'id' | 'created_at'>) => Promise<Product | Omit<Product, 'id' | 'created_at'>>;
}
export default ProductDatabaseRepository;
