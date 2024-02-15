import type { CollectionName } from './collectionNames';
import type { IBaseDatabase, IWebhookRepository, Webhook } from '../types';
import BaseRepository from './BaseRepository';
declare class WebhookDatabaseRepository extends BaseRepository<Webhook> implements IWebhookRepository {
    _database: IBaseDatabase<Webhook>;
    _collectionName: CollectionName;
    constructor(database: IBaseDatabase<Webhook>);
    create: (model: Omit<Webhook, 'id' | 'created_at'>) => Promise<Webhook>;
    deleteByID: (id: string) => Promise<void>;
    getAll: (userID?: string | null | undefined) => Promise<Array<Webhook>>;
    getByID: (id: string) => Promise<Webhook | null | undefined>;
    updateByID: () => Promise<Webhook>;
}
export default WebhookDatabaseRepository;
