import type { CollectionName } from './collectionNames';
import type { IBaseDatabase } from '../types';

import COLLECTION_NAMES from './collectionNames';
import BaseRepository from './BaseRepository';
import Logger from '../lib/logger';
import { IProductFirmwareRepository, ProductFirmware } from 'spark-protocol';

const logger = Logger.createModuleLogger(module);

const formatProductFirmwareFromDb = (
  productFirmware: ProductFirmware,
): ProductFirmware => ({
  ...productFirmware,
  // todo right now its hack for getting right buffer from different dbs
  data: productFirmware.data.buffer
    ? Buffer.from(productFirmware.data.buffer) // for mongo
    : // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Buffer.from(Object.values(productFirmware.data) as Array<any>), // for nedb,
});

class ProductFirmwareDatabaseRepository
  extends BaseRepository<ProductFirmware>
  implements IProductFirmwareRepository
{
  _database: IBaseDatabase<ProductFirmware>;

  _collectionName: CollectionName = COLLECTION_NAMES.PRODUCT_FIRMWARE;

  constructor(database: IBaseDatabase<ProductFirmware>) {
    super(database, COLLECTION_NAMES.PRODUCT_FIRMWARE);
    this._database = database;

    this.tryCreateIndex({ product_id: 1 });
    this.tryCreateIndex({ ownerID: 1 });
    this.tryCreateIndex({ product_id: 1, version: 1 });
    this.tryCreateIndex({ product_id: 1, current: 1 });
  }

  countByProductID = <TQuery extends Record<string, unknown>>(
    productID: number,
    query: TQuery,
  ): Promise<number> =>
    this._database.count(this._collectionName, {
      ...query,
      product_id: productID,
    });

  create = async (
    model: Omit<ProductFirmware, 'id' | 'created_at'>,
  ): Promise<ProductFirmware> =>
    this._database.insertOne(this._collectionName, {
      ...model,
      updated_at: new Date(),
    });

  deleteByID: (id: string) => Promise<void> = async (
    id: string,
  ): Promise<void> => this._database.remove(this._collectionName, { _id: id });

  getAll: (
    userID?: string | null | undefined,
  ) => Promise<Array<ProductFirmware>> = async (
    userID: string | null = null,
  ): Promise<Array<ProductFirmware>> => {
    // TODO - this should probably just query the organization
    const query = userID ? { ownerID: userID } : {};
    return (await this._database.find(this._collectionName, query)).map(
      formatProductFirmwareFromDb,
    );
  };

  getManyByProductID = async <TQuery extends Record<string, unknown>>(
    productID: number,
    query?: TQuery,
  ): Promise<Array<ProductFirmware>> =>
    (
      await this._database.find(this._collectionName, {
        ...query,
        product_id: productID,
      })
    ).map(formatProductFirmwareFromDb);

  async getAllByProductID(productID: number): Promise<ProductFirmware[]> {
    return (
      await this._database.find(this._collectionName, {
        product_id: productID,
      })
    ).map(formatProductFirmwareFromDb);
  }

  getByVersionForProduct: (
    productID: number,
    version: number,
  ) => Promise<ProductFirmware | null | undefined> = async (
    productID: number,
    version: number,
  ): Promise<ProductFirmware | null | undefined> => {
    const productFirmware = await this._database.findOne(this._collectionName, {
      product_id: productID,
      version,
    });
    return productFirmware
      ? formatProductFirmwareFromDb(productFirmware)
      : null;
  };

  getCurrentForProduct: (
    productID: number,
  ) => Promise<ProductFirmware | null | undefined> = async (
    productID: number,
  ): Promise<ProductFirmware | null | undefined> => {
    const productFirmware = await this._database.findOne(this._collectionName, {
      current: true,
      product_id: productID,
    });
    return productFirmware
      ? formatProductFirmwareFromDb(productFirmware)
      : null;
  };

  getByID: (id: string) => Promise<ProductFirmware | null | undefined> = async (
    id: string,
  ): Promise<ProductFirmware | null | undefined> => {
    const productFirmware = await this._database.findOne(this._collectionName, {
      _id: id,
    });
    return productFirmware
      ? formatProductFirmwareFromDb(productFirmware)
      : null;
  };

  updateByID: (
    productFirmwareID: string,
    productFirmware: ProductFirmware,
  ) => Promise<ProductFirmware> = async (
    productFirmwareID: string,
    productFirmware: ProductFirmware,
  ): Promise<ProductFirmware> => {
    const { data: _, ...loggingProps } = productFirmware;
    logger.info(loggingProps, 'Update Product Firmware');
    return this._database
      .findAndModify(
        this._collectionName,
        { _id: productFirmwareID },
        {
          $set: {
            ...productFirmware,
            data: Array.from(productFirmware.data),
            updated_at: new Date(),
          },
        },
      )
      .then(formatProductFirmwareFromDb);
  };

  deleteByProductID: (productID: number) => Promise<void> = async (
    productID: number,
  ): Promise<void> =>
    this._database.remove(this._collectionName, {
      product_id: productID,
    });
}

export default ProductFirmwareDatabaseRepository;
