import EventEmitter from 'events';
import {
  Collection,
  Db,
  IndexSpecification,
  MongoClient,
  MongoClientOptions,
  Document,
  DeleteResult,
} from 'mongodb';
import type { IBaseDatabase } from '../types';
import BaseMongoDb from './BaseMongoDb';
import Logger from '../lib/logger';
import nullthrows from 'nullthrows';
import { filterFalsyValues } from '@brewskey/spark-protocol';

const logger = Logger.createModuleLogger(module);

const DB_READY_EVENT = 'dbReady';

class MongoDb<
    TEntity extends { id: string; created_at: number } = Document & {
      id: string;
      created_at: number;
    },
  >
  extends BaseMongoDb
  implements IBaseDatabase<TEntity>
{
  _database!: Db;

  _statusEventEmitter: EventEmitter = new EventEmitter();

  constructor(url: string, options?: MongoClientOptions | undefined) {
    super();

    (async () => {
      await this._init(url, options);
    })();
  }

  tryCreateIndex = async (
    collectionName: string,
    indexConfig: IndexSpecification,
  ): Promise<void> => {
    await this.__runForCollection(
      collectionName,
      async (collection: Collection): Promise<string> =>
        collection.createIndex(indexConfig),
    );
  };

  count = async (
    collectionName: string,
    query?: Record<string, unknown>,
  ): Promise<number> =>
    this.__runForCollection(
      collectionName,
      async (collection: Collection): Promise<number> =>
        collection.countDocuments(this.__translateQuery(query), {
          maxTimeMS: 15_000,
        }),
    ) || 0;

  insertOne = async (
    collectionName: string,
    entity: Omit<TEntity, 'id' | 'created_at'>,
  ): Promise<TEntity> =>
    this.__runForCollection(
      collectionName,
      async (collection: Collection): Promise<TEntity> => {
        const insertResult = await collection.insertOne(entity);
        const result = await collection.findOne({
          _id: insertResult.insertedId,
        });
        return nullthrows(
          this.__translateResultItem(result as unknown as TEntity | undefined),
        );
      },
    );

  find = async <TQuery extends { skip?: string; take?: string }>(
    collectionName: string,
    query: TQuery,
  ): Promise<TEntity[]> =>
    this.__runForCollection(
      collectionName,
      async (collection: Collection): Promise<TEntity[]> => {
        const { skip, take, ...otherQuery } = query ?? {};
        let result = collection.find(this.__translateQuery(otherQuery), {
          timeout: false,
        });

        if (skip && parseInt(skip, 10) === 0) {
          result = result.skip(parseInt(skip, 10));
        }

        if (take && parseInt(take, 10) === 0) {
          result = result.limit(parseInt(take, 10));
        }

        const resultItems = await result.toArray();
        return (resultItems as unknown as TEntity[])
          .map(this.__translateResultItem)
          .filter(filterFalsyValues);
      },
    );

  findAndModify = async (
    collectionName: string,
    query: Record<string, unknown>,
    updateQuery: Record<string, unknown>,
  ): Promise<TEntity> =>
    this.__runForCollection(
      collectionName,
      async (collection: Collection): Promise<TEntity> => {
        const modifyResult = await collection.findOneAndUpdate(
          this.__translateQuery(query),
          this.__translateQuery(updateQuery),
          { upsert: true },
        );
        return nullthrows(
          this.__translateResultItem(modifyResult as unknown as TEntity),
        );
      },
    );

  findOne = async (
    collectionName: string,
    query?: Record<string, unknown>,
  ): Promise<TEntity> =>
    this.__runForCollection(
      collectionName,
      async (collection: Collection): Promise<TEntity> => {
        const resultItem = await collection.findOne(
          this.__translateQuery(query),
        );

        return nullthrows(
          this.__translateResultItem(resultItem as unknown as TEntity),
        );
      },
    );

  remove = async (
    collectionName: string,
    query?: Record<string, unknown>,
  ): Promise<void> => {
    await this.__runForCollection(
      collectionName,
      async (collection: Collection): Promise<DeleteResult> =>
        collection.deleteMany(this.__translateQuery(query)),
    );
  };

  __runForCollection = async <TResult>(
    collectionName: string,
    callback: (collection: Collection) => Promise<TResult>,
  ): Promise<TResult> => {
    await this._isDbReady();
    // hack for flow:
    if (!this._database) {
      throw new Error('database is not initialized');
    }
    return callback(this._database.collection(collectionName)).catch(
      (error: Error) => {
        logger.error({ collectionName, err: error }, 'Run for Collection');
        throw error;
      },
    );
  };

  _init = async (url: string, options: MongoClientOptions | undefined) => {
    const database = await MongoClient.connect(url, options);

    database.on('error', (error: Error): void =>
      logger.error({ err: error, options, url }, 'DB connection Error: '),
    );

    database.on('open', (): void => logger.info('DB connected'));

    database.on('close', (str: string): void =>
      logger.info({ info: str }, 'DB disconnected: '),
    );

    this._database = database.db();
    this._statusEventEmitter.emit(DB_READY_EVENT);
  };

  _isDbReady: () => Promise<void> = async (): Promise<void> => {
    if (this._database) {
      return Promise.resolve();
    }

    return new Promise((resolve: () => void) => {
      this._statusEventEmitter.once(DB_READY_EVENT, (): void => resolve());
    });
  };
}

export default MongoDb;
