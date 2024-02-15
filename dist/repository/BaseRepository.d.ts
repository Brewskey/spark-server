import type { CollectionName } from './collectionNames';
import type { IBaseDatabase } from '../types';
import { IndexSpecification } from 'mongodb';
declare class BaseRepository<TEntity> {
    _database: IBaseDatabase<TEntity>;
    _collectionName: CollectionName;
    constructor(database: IBaseDatabase<TEntity>, collectionName: CollectionName);
    tryCreateIndex: (indexConfig: IndexSpecification) => Promise<void>;
    count: (filter?: Record<string, unknown>) => Promise<number>;
}
export default BaseRepository;
