import type { CollectionName } from './collectionNames';
import type { IBaseDatabase } from '../types';
import { IndexSpecification } from 'mongodb';

class BaseRepository<TEntity> {
  _database: IBaseDatabase<TEntity>;

  _collectionName: CollectionName;

  constructor(
    database: IBaseDatabase<TEntity>,
    collectionName: CollectionName,
  ) {
    this._database = database;
    this._collectionName = collectionName;
  }

  tryCreateIndex = async (indexConfig: IndexSpecification): Promise<void> =>
    this._database.tryCreateIndex(this._collectionName, indexConfig);

  count = async (filter?: Record<string, unknown>): Promise<number> =>
    this._database.count(this._collectionName, filter);
}

export default BaseRepository;
