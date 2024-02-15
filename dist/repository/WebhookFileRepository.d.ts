import { JSONFileManager } from 'spark-protocol';
import type { IWebhookRepository, Webhook } from '../types';
declare class WebhookFileRepository implements IWebhookRepository {
    _fileManager: JSONFileManager;
    constructor(path: string);
    count: () => Promise<number>;
    create(model: Webhook): Promise<Webhook>;
    deleteByID(id: string): Promise<void>;
    getAll: (userID?: string | null | undefined) => Promise<Array<Webhook>>;
    getByID(id: string): Promise<Webhook | null | undefined>;
    updateByID: () => Promise<Webhook>;
    _getAll(): Promise<Array<Webhook>>;
}
export default WebhookFileRepository;
