import type { CollectionName } from './collectionNames';
import type {
  IBaseDatabase,
  IProductConfigRepository,
  ProductConfig,
} from '../types';

import COLLECTION_NAMES from './collectionNames';
import BaseRepository from './BaseRepository';

class ProductConfigDatabaseRepository
  extends BaseRepository<ProductConfig>
  implements IProductConfigRepository
{
  _database: IBaseDatabase<ProductConfig>;

  _collectionName: CollectionName = COLLECTION_NAMES.PRODUCT_CONFIGS;

  constructor(database: IBaseDatabase<ProductConfig>) {
    super(database, COLLECTION_NAMES.PRODUCT_CONFIGS);
    this._database = database;

    this.tryCreateIndex({ ownerID: 1 });
    this.tryCreateIndex({ product_id: 1 });
  }

  create = async (
    model: Omit<ProductConfig, 'id' | 'created_at'>,
  ): Promise<ProductConfig> =>
    this._database.insertOne(this._collectionName, {
      ...model,
    });

  deleteByID: (id: string) => Promise<void> = async (
    id: string,
  ): Promise<void> => this._database.remove(this._collectionName, { _id: id });

  getAll: (
    userID?: string | null | undefined,
  ) => Promise<Array<ProductConfig>> = async (
    userID: string | null = null,
  ): Promise<Array<ProductConfig>> => {
    // TODO - this should probably just query the organization
    const query = userID ? { ownerID: userID } : {};
    return this._database.find(this._collectionName, query);
  };

  getByProductID: (
    productID: number,
  ) => Promise<ProductConfig | null | undefined> = async (
    productID: number,
  ): Promise<ProductConfig | null | undefined> =>
    this._database.findOne(this._collectionName, {
      product_id: productID,
    });

  getByID: (id: string) => Promise<ProductConfig | null | undefined> = async (
    id: string,
  ): Promise<ProductConfig | null | undefined> =>
    this._database.findOne(this._collectionName, { _id: id });

  updateByID: () => Promise<ProductConfig> =
    async (): Promise<ProductConfig> => {
      throw new Error('The method is not implemented');
    };
}

export default ProductConfigDatabaseRepository;
