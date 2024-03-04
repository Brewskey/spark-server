import {
  DeviceAttributes,
  DeviceKeyAlgorithm,
  DeviceKeyObject,
  filterFalsyValues,
  NAME_GENERATOR,
  Organization,
  Product,
  ProductConfig,
  ProductDevice,
  ProductFirmware,
  User,
  UserRole,
  Webhook,
} from '@brewskey/spark-protocol';
import { Db, ObjectId } from 'mongodb';
import nullthrows from 'nullthrows';
import { EntityTarget, ObjectLiteral } from 'typeorm';

import COLLECTION_NAMES, {
  CollectionName,
} from '../repository/collectionNames';
import MongoDb from '../repository/MongoDb';
import settings from '../settings';
import { SparkServerDataSource } from '../SparkServerDataSource';

function removeEmpty(obj: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v != null));
}

const CACHED_USERS: Record<string, boolean> = {};
const CACHED_DEVICE_KEYS: Record<string, boolean> = {};
const ORGANIZATION_IDS: string[] = [];

const getKeyIncrementFn = (keys: string[]) => (key: unknown) => {
  const index = keys.indexOf(key as string) + 1;
  if (index >= 1) {
    return index;
  }

  keys.push(key as string);
  return keys.length;
};

const getOrganizationID = getKeyIncrementFn(ORGANIZATION_IDS);
const getProductConfigID = getKeyIncrementFn([]);

const MONGO_COLLECTION_TO_ENTITY: {
  [key in CollectionName]: {
    converter?: (
      entity: Record<string, unknown>,
      database: Db,
    ) => Promise<Record<string, unknown> | null>;
    entityType: EntityTarget<ObjectLiteral>;
  };
} = {
  deviceAttributes: {
    entityType: DeviceAttributes,
    converter: async (entity) => {
      return {
        name: NAME_GENERATOR.choose(),
        ...removeEmpty(entity),
        createdAt: entity.timestamp,
        updatedAt: entity.timestamp,
      };
    },
  },
  deviceKeys: {
    entityType: DeviceKeyObject,
    converter: async (entity) => {
      if (CACHED_DEVICE_KEYS[entity.deviceID as string]) {
        return null;
      }
      CACHED_DEVICE_KEYS[entity.deviceID as string] = true;

      return {
        algorithm: DeviceKeyAlgorithm.RSA,
        ...entity,
      };
    },
  },
  organizations: { entityType: Organization },
  products: {
    entityType: Product,
    converter: async (entity) => {
      const productConfigID = getProductConfigID(entity.product_config_id);
      console.log(entity);
      return {
        ...entity,
        id: entity.product_id,
        latestFirmwareVersion: entity.latestFirmwareVersion,
        hardwareVersion: entity.hardware_version,
        platformID: entity.platform_id,
        productConfigID,
      };
    },
  },
  productConfigs: {
    entityType: ProductConfig,
    converter: async (entity, database) => {
      const product = await database
        .collection(COLLECTION_NAMES.PRODUCTS)
        .findOne({ _id: new ObjectId(entity.product_id as string) });
      if (!product) {
        return null;
      }

      const productConfigID = getProductConfigID(entity._id);
      return {
        ...entity,
        id: productConfigID,
        productID: nullthrows(product).product_id,
        organizationID: getOrganizationID(entity.org_id),
      };
    },
  },
  productDevices: {
    entityType: ProductDevice,
    converter: async ({ id: _, ...entity }, database) => {
      const device = await database
        .collection(COLLECTION_NAMES.DEVICE_ATTRIBUTES)
        .findOne({ deviceID: entity.deviceID });
      if (!device) {
        return null;
      }

      const product = await database
        .collection(COLLECTION_NAMES.PRODUCTS)
        .findOne({ product_id: entity.productID });
      if (!product) {
        return null;
      }

      return {
        notes: '',
        ...removeEmpty(entity),
        isDenied: entity.denied,
        isDevelopment: entity.development,
        isQuarantined: entity.quarantined,
      };
    },
  },
  productFirmware: {
    entityType: ProductFirmware,
    converter: async ({ id: _, ...entity }, database) => {
      const product = await database
        .collection(COLLECTION_NAMES.PRODUCTS)
        .findOne({ product_id: entity.product_id });
      if (!product) {
        return null;
      }

      return {
        ...entity,
        isCurrent: entity.current,
        deviceCount: entity.device_count,
        productID: entity.product_id,
        createdAt: entity.created_at,
        updatedAt: entity.updated_at,
      };
    },
  },
  users: {
    entityType: User,
    converter: async (entity) => {
      if (CACHED_USERS[entity.username as string]) {
        return null;
      }
      CACHED_USERS[entity.username as string] = true;
      return {
        ...entity,
        role: entity.role ?? UserRole.Default,
        createdAt: entity.created_at,
        userName: nullthrows(entity.username),
      };
    },
  },
  webhooks: { entityType: Webhook },
};

(async () => {
  const oldDb = new MongoDb(
    nullthrows(settings.DB_CONFIG.URL),
    settings.DB_CONFIG.OPTIONS,
  );

  await SparkServerDataSource.initialize();

  // Truncate database
  // const entities = SparkServerDataSource.entityMetadatas;
  // SparkServerDataSource.transaction(async (entityManager): Promise<void> => {
  //   await Promise.all(
  //     entities.map(async (entity) => {
  //       const repository = entityManager.getRepository(entity.target);
  //       await repository.clear();
  //     }),
  //   );
  // });
  // console.log('Purged Database');

  const keys = Object.keys(MONGO_COLLECTION_TO_ENTITY) as CollectionName[];

  await SparkServerDataSource.transaction(
    async (entityManager): Promise<void> => {
      for await (const key of keys) {
        const mongoEntities = await oldDb._database
          .collection(key)
          .find()
          .toArray();

        const { converter = (item) => item, entityType } =
          MONGO_COLLECTION_TO_ENTITY[key];
        const repository = entityManager.getRepository(entityType);
        await repository.save(
          (
            await Promise.all(
              mongoEntities.map((entity) => converter(entity, oldDb._database)),
            )
          ).filter(filterFalsyValues),
        );
        console.log('Finished ' + key);
      }
    },
  );
  console.log('Finished Transaction');

  await oldDb._client.close();
  await SparkServerDataSource.destroy();
})();
