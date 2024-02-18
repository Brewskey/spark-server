import type { CollectionName } from './collectionNames';
import type { IBaseDatabase } from '../types';

import COLLECTION_NAMES from './collectionNames';
import BaseRepository from './BaseRepository';
import {
  DeviceAttributes,
  IDeviceAttributeRepository,
  IProductDeviceRepository,
  filterFalsyValues,
} from '@brewskey/spark-protocol';

// getByID, deleteByID and update uses model.deviceID as ID for querying
class DeviceAttributeDatabaseRepository
  extends BaseRepository<DeviceAttributes>
  implements IDeviceAttributeRepository
{
  _database: IBaseDatabase<DeviceAttributes>;

  _collectionName: CollectionName = COLLECTION_NAMES.DEVICE_ATTRIBUTES;

  _productDeviceRepository: IProductDeviceRepository;

  constructor(
    database: IBaseDatabase<DeviceAttributes>,
    productDeviceRepository: IProductDeviceRepository,
  ) {
    super(database, COLLECTION_NAMES.DEVICE_ATTRIBUTES);
    this._database = database;
    this._productDeviceRepository = productDeviceRepository;

    this.tryCreateIndex({ ownerID: 1 });
    this.tryCreateIndex({ deviceID: 1 });
    this.tryCreateIndex({ name: 1 });
  }

  create: () => Promise<DeviceAttributes> =
    async (): Promise<DeviceAttributes> => {
      throw new Error('The method is not implemented');
    };

  deleteByID: (deviceID: string) => Promise<void> = async (
    deviceID: string,
  ): Promise<void> =>
    this._database.remove(this._collectionName, {
      deviceID: deviceID.toLowerCase(),
    });

  getAll = async (
    userID: string | null = null,
  ): Promise<Array<DeviceAttributes>> => {
    const query = userID ? { ownerID: userID } : {};
    return (await this._database.find(this._collectionName, query))
      .map(this._parseVariables)
      .filter(filterFalsyValues);
  };

  getByID = async (
    deviceID: string,
  ): Promise<DeviceAttributes | null | undefined> =>
    this._parseVariables(
      await this._database.findOne(this._collectionName, {
        deviceID: deviceID.toLowerCase(),
      }),
    );

  getByName = async (name: string): Promise<DeviceAttributes | undefined> =>
    this._parseVariables(
      await this._database.findOne(this._collectionName, {
        name,
      }),
    );

  getManyFromIDs: (
    deviceIDs: Array<string>,
    ownerID?: string,
  ) => Promise<Array<DeviceAttributes>> = async (
    deviceIDs: Array<string>,
    ownerID?: string,
  ): Promise<Array<DeviceAttributes>> => // todo  $in operator doesn't work for neDb(no matter with regexp or plain strings)
    (
      await this._database.find(this._collectionName, {
        deviceID: {
          $in: deviceIDs.map((id: string): string => id.toLowerCase()),
        },
        ...(ownerID ? { ownerID } : {}),
      })
    )
      .map(this._parseVariables)
      .filter(filterFalsyValues);

  updateByID: (
    deviceID: string,
    attributes: Partial<DeviceAttributes>,
  ) => Promise<DeviceAttributes> = async (
    deviceID: string,
    { variables, ...props }: Partial<DeviceAttributes>,
  ): Promise<DeviceAttributes> => {
    const attributesToSave = {
      ...props,
      ...(variables ? { variables: JSON.stringify(variables) } : {}),
      deviceID: deviceID.toLowerCase(),
    } as const;

    // Keep product-devices in sync
    const existingAttributes = await this.getByID(deviceID);
    const productDevice =
      await this._productDeviceRepository.getFromDeviceID(deviceID);
    if (productDevice) {
      productDevice.productFirmwareVersion = existingAttributes
        ? existingAttributes.productFirmwareVersion
        : 65535;
      await this._productDeviceRepository.updateByID(
        productDevice.id,
        productDevice,
      );
    }

    return this._database.findAndModify(
      this._collectionName,
      { deviceID: deviceID.toLowerCase() },
      { $set: { ...attributesToSave, timestamp: new Date() } },
    );
  };

  // mongo and neDB don't support dots in variables names
  // but some of the server users want to have dots in their device var names
  // so we have to stringify them and parse back.
  _parseVariables = (
    attributesFromDB?: DeviceAttributes | null,
  ): DeviceAttributes | undefined => {
    if (!attributesFromDB) {
      return;
    }

    const { variables } = attributesFromDB;
    try {
      return {
        ...attributesFromDB,
        variables:
          variables && typeof variables === 'string'
            ? JSON.parse(variables)
            : undefined,
      };
    } catch (ignore) {
      return attributesFromDB;
    }
  };
}
export default DeviceAttributeDatabaseRepository;
