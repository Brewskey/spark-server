import type { Webhook, WebhookMutator } from '../types';
import type WebhookManager from '../managers/WebhookManager';
import Controller from './Controller';
import { HttpResult } from './types';
declare class WebhooksController extends Controller {
    _webhookManager: WebhookManager;
    constructor(webhookManager: WebhookManager);
    getAll(): Promise<HttpResult<Webhook[]>>;
    getByID(webhookID: string): Promise<HttpResult<Webhook>>;
    create(model: WebhookMutator): Promise<HttpResult<{
        created_at: Date;
        event: string;
        id: string;
        ok: true;
        url: string;
    }>>;
    deleteByID(webhookID: string): Promise<HttpResult<{
        ok: true;
    }>>;
}
export default WebhooksController;
