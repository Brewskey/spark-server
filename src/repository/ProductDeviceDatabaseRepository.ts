import type { CollectionName } from './collectionNames';
import type { IBaseDatabase, ProductDevice } from '../types';

import COLLECTION_NAMES from './collectionNames';
import BaseRepository from './BaseRepository';
import { IProductDeviceRepository } from '@brewskey/spark-protocol';

class ProductDeviceDatabaseRepository
  extends BaseRepository<ProductDevice>
  implements IProductDeviceRepository
{
  _database: IBaseDatabase<ProductDevice>;

  _collectionName: CollectionName = COLLECTION_NAMES.PRODUCT_DEVICES;

  constructor(database: IBaseDatabase<ProductDevice>) {
    super(database, COLLECTION_NAMES.PRODUCT_DEVICES);
    this._database = database;

    this.tryCreateIndex({ productID: 1 });
    this.tryCreateIndex({ productID: 1, productFirmwareVersion: 1 });
    this.tryCreateIndex({ ownerID: 1 });
    this.tryCreateIndex({ deviceID: 1 });
    this.tryCreateIndex({ product_id: 1 });
  }

  countByProductID = <TQuery extends Record<string, unknown>>(
    productID: number,
    query: TQuery,
  ): Promise<number> =>
    this._database.count(this._collectionName, {
      ...query,
      productID,
    });

  create = async (
    model: Omit<ProductDevice, 'id' | 'created_at'>,
  ): Promise<ProductDevice> =>
    this._database.insertOne(this._collectionName, {
      ...model,
    });

  deleteByID: (id: string) => Promise<void> = async (
    id: string,
  ): Promise<void> => this._database.remove(this._collectionName, { _id: id });

  getAll: (
    userID?: string | null | undefined,
  ) => Promise<Array<ProductDevice>> = async (
    userID: string | null = null,
  ): Promise<Array<ProductDevice>> => {
    // TODO - this should probably just query the organization
    const query = userID ? { ownerID: userID } : {};
    return this._database.find(this._collectionName, query);
  };

  getAllByProductID: (
    productID: number,
    skip: number,
    take: number,
  ) => Promise<Array<ProductDevice>> = async (
    productID: number,
    skip: number,
    take: number,
  ): Promise<Array<ProductDevice>> =>
    this._database.find(this._collectionName, {
      productID,
      skip,
      take,
    });

  getManyByProductID = async <TQuery extends Record<string, unknown>>(
    productID: number,
    query?: TQuery,
  ): Promise<Array<ProductDevice>> =>
    this._database.find(this._collectionName, {
      ...query,
      productID,
    });

  getByID: (id: string) => Promise<ProductDevice | null | undefined> = async (
    id: string,
  ): Promise<ProductDevice | null | undefined> =>
    this._database.findOne(this._collectionName, { _id: id });

  getFromDeviceID: (
    deviceID: string,
  ) => Promise<ProductDevice | null | undefined> = async (
    deviceID: string,
  ): Promise<ProductDevice | null | undefined> =>
    this._database.findOne(this._collectionName, {
      deviceID: deviceID.toLowerCase(),
    });

  getManyFromDeviceIDs: (
    deviceIDs: Array<string>,
  ) => Promise<Array<ProductDevice>> = async (
    deviceIDs: Array<string>,
  ): Promise<Array<ProductDevice>> => // todo  $in operator doesn't work for neDb(no matter with regexp or plain strings)
    this._database.find(this._collectionName, {
      deviceID: {
        $in: deviceIDs.map((id: string): string => id.toLowerCase()),
      },
    });

  updateByID: (
    productDeviceID: string,
    productDevice: ProductDevice,
  ) => Promise<ProductDevice> = async (
    productDeviceID: string,
    productDevice: ProductDevice,
  ): Promise<ProductDevice> =>
    this._database.findAndModify(
      this._collectionName,
      { _id: productDeviceID },
      {
        $set: {
          ...productDevice,
          ...(productDevice.deviceID
            ? { deviceID: productDevice.deviceID.toLowerCase() }
            : {}),
        },
      },
    );

  deleteByProductID: (productID: number) => Promise<void> = async (
    productID: number,
  ): Promise<void> =>
    this._database.remove(this._collectionName, {
      product_id: productID,
    });
}

export default ProductDeviceDatabaseRepository;
