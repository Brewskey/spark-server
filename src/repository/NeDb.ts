import fs from 'fs';
import { mkdirp } from 'mkdirp';
import Datastore from 'nedb-core';
import type { IBaseDatabase } from '../types';
import type { CollectionName } from './collectionNames';
import COLLECTION_NAMES from './collectionNames';
import { promisify } from '../lib/promisify';
import BaseMongoDb from './BaseMongoDb';
import { IndexSpecification } from 'mongodb';
import nullthrows from 'nullthrows';
import { Singleton } from 'constitute';

class NeDb<TEntity extends { id: string } = { id: string }>
  extends BaseMongoDb
  implements IBaseDatabase<TEntity>
{
  static constitute() {
    return Singleton.with(['DATABASE_PATH']);
  }

  _database: Record<string, Datastore>;

  constructor(path: string) {
    super();

    if (!fs.existsSync(path)) {
      mkdirp.sync(path);
    }

    this._database = {};

    Object.values(COLLECTION_NAMES).forEach(
      (collectionName: CollectionName) => {
        this._database[collectionName] = new Datastore({
          autoload: true,
          filename: `${path}/${collectionName}.db`,
          inMemoryOnly: process.env.NODE_ENV === 'test',
        });
      },
    );
  }

  tryCreateIndex = async (
    collectionName: string,
    indexConfig: IndexSpecification,
  ): Promise<void> =>
    this.__runForCollection(collectionName, async (collection: Datastore) => {
      collection.ensureIndex(indexConfig);
    });

  count = async <TQuery extends Record<string, unknown>>(
    collectionName: string,
    query?: TQuery,
  ): Promise<number> =>
    (await this.__runForCollection(
      collectionName,
      (collection: Datastore): Promise<number> =>
        promisify(collection, 'count', query),
    )) || 0;

  insertOne = (collectionName: string, entity: TEntity): Promise<TEntity> =>
    this.__runForCollection(
      collectionName,
      async (collection: Datastore): Promise<TEntity> => {
        const insertResult = await promisify(collection, 'insert', entity);

        return nullthrows(this.__translateResultItem<TEntity>(insertResult));
      },
    );

  find = async <TQuery extends { skip?: string; take?: string }>(
    collectionName: string,
    query: TQuery,
  ): Promise<TEntity[]> =>
    this.__runForCollection(
      collectionName,
      async (collection: Datastore): Promise<TEntity[]> => {
        const { skip, take, ...otherQuery } = query;
        let result = collection.find(otherQuery);

        if (skip && parseInt(skip, 10) !== 0) {
          result = result.skip(parseInt(skip, 10));
        }
        if (take && parseInt(take, 10) !== 0) {
          result = result.limit(parseInt(take, 10));
        }

        const resultItems = await promisify(result, 'exec');
        return resultItems.map(this.__translateResultItem);
      },
    );

  findAndModify = async (
    collectionName: string,
    query: Record<string, unknown>,
    updateQuery: Record<string, unknown>,
  ): Promise<TEntity> =>
    this.__runForCollection(
      collectionName,
      async (collection: Datastore): Promise<TEntity> => {
        const [_count, resultItem] = await promisify(
          collection,
          'update',
          query,
          updateQuery,
          {
            returnUpdatedDocs: true,
            upsert: true,
          },
        );

        return nullthrows(this.__translateResultItem(resultItem));
      },
    );

  findOne = async (
    collectionName: string,
    query: Record<string, unknown>,
  ): Promise<TEntity | undefined> =>
    this.__runForCollection(
      collectionName,
      async (collection: Datastore): Promise<TEntity> => {
        const resultItem = await promisify(collection, 'findOne', query);
        return this.__translateResultItem(resultItem);
      },
    );

  remove = async (
    collectionName: string,
    query: Record<string, unknown>,
  ): Promise<void> =>
    this.__runForCollection(
      collectionName,
      (collection: Datastore): Promise<void> =>
        promisify(collection, 'remove', query),
    );

  __runForCollection = <TResult>(
    collectionName: string,
    callback: (collection: Datastore) => Promise<TResult>,
  ): Promise<TResult> => callback(this._database[collectionName]);
}

export default NeDb;
