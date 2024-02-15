import type { CollectionName } from './collectionNames';
import type { IBaseDatabase, IWebhookRepository, Webhook } from '../types';

import COLLECTION_NAMES from './collectionNames';
import BaseRepository from './BaseRepository';

class WebhookDatabaseRepository
  extends BaseRepository<Webhook>
  implements IWebhookRepository
{
  _database: IBaseDatabase<Webhook>;

  _collectionName: CollectionName = COLLECTION_NAMES.WEBHOOKS;

  constructor(database: IBaseDatabase<Webhook>) {
    super(database, COLLECTION_NAMES.WEBHOOKS);
    this._database = database;

    this.tryCreateIndex({ ownerID: 1 });
  }

  create = async (
    model: Omit<Webhook, 'id' | 'created_at'>,
  ): Promise<Webhook> =>
    this._database.insertOne(this._collectionName, {
      ...model,
    });

  deleteByID: (id: string) => Promise<void> = async (
    id: string,
  ): Promise<void> => this._database.remove(this._collectionName, { _id: id });

  getAll: (userID?: string | null | undefined) => Promise<Array<Webhook>> =
    async (userID: string | null = null): Promise<Array<Webhook>> => {
      const query = userID ? { ownerID: userID } : {};
      return this._database.find(this._collectionName, query);
    };

  getByID: (id: string) => Promise<Webhook | null | undefined> = async (
    id: string,
  ): Promise<Webhook | null | undefined> =>
    this._database.findOne(this._collectionName, { _id: id });

  updateByID: () => Promise<Webhook> = async (): Promise<Webhook> => {
    throw new Error('The method is not implemented');
  };
}

export default WebhookDatabaseRepository;
