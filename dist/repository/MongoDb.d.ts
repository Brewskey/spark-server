/// <reference types="node" />
import EventEmitter from 'events';
import { Collection, Db, IndexSpecification, MongoClientOptions, Document } from 'mongodb';
import type { IBaseDatabase } from '../types';
import BaseMongoDb from './BaseMongoDb';
declare class MongoDb<TEntity extends {
    id: string;
    created_at: number;
} = Document & {
    id: string;
    created_at: number;
}> extends BaseMongoDb implements IBaseDatabase<TEntity> {
    _database: Db;
    _statusEventEmitter: EventEmitter;
    constructor(url: string, options?: MongoClientOptions | undefined);
    tryCreateIndex: (collectionName: string, indexConfig: IndexSpecification) => Promise<void>;
    count: (collectionName: string, query?: Record<string, unknown>) => Promise<number>;
    insertOne: (collectionName: string, entity: Omit<TEntity, 'id' | 'created_at'>) => Promise<TEntity>;
    find: <TQuery extends {
        skip?: string | undefined;
        take?: string | undefined;
    }>(collectionName: string, query: TQuery) => Promise<TEntity[]>;
    findAndModify: (collectionName: string, query: Record<string, unknown>, updateQuery: Record<string, unknown>) => Promise<TEntity>;
    findOne: (collectionName: string, query?: Record<string, unknown>) => Promise<TEntity>;
    remove: (collectionName: string, query?: Record<string, unknown>) => Promise<void>;
    __runForCollection: <TResult>(collectionName: string, callback: (collection: Collection) => Promise<TResult>) => Promise<TResult>;
    _init: (url: string, options: MongoClientOptions | undefined) => Promise<void>;
    _isDbReady: () => Promise<void>;
}
export default MongoDb;
