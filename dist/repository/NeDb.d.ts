/// <reference types="global" />
import Datastore from 'nedb-core';
import type { IBaseDatabase } from '../types';
import BaseMongoDb from './BaseMongoDb';
import { IndexSpecification } from 'mongodb';
declare class NeDb<TEntity extends {
    id: string;
} = {
    id: string;
}> extends BaseMongoDb implements IBaseDatabase<TEntity> {
    static constitute(): string[];
    _database: Record<string, Datastore>;
    constructor(path: string);
    tryCreateIndex: (collectionName: string, indexConfig: IndexSpecification) => Promise<void>;
    count: <TQuery extends Record<string, unknown>>(collectionName: string, query?: TQuery | undefined) => Promise<number>;
    insertOne: (collectionName: string, entity: TEntity) => Promise<TEntity>;
    find: <TQuery extends {
        skip?: string | undefined;
        take?: string | undefined;
    }>(collectionName: string, query: TQuery) => Promise<TEntity[]>;
    findAndModify: (collectionName: string, query: Record<string, unknown>, updateQuery: Record<string, unknown>) => Promise<TEntity>;
    findOne: (collectionName: string, query: Record<string, unknown>) => Promise<TEntity | undefined>;
    remove: (collectionName: string, query: Record<string, unknown>) => Promise<void>;
    __runForCollection: <TResult>(collectionName: string, callback: (collection: Datastore) => Promise<TResult>) => Promise<TResult>;
}
export default NeDb;
