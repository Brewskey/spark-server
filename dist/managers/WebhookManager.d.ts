/// <reference types="lodash" />
/// <reference types="node" />
import type { EventPublisher } from 'spark-protocol';
import { CoreOptions, UrlOptions } from 'request';
import type PermissionManager from './PermissionManager';
import type { IWebhookRepository, Webhook, WebhookMutator } from '../types';
import { ProtocolEvent } from 'spark-protocol/dist/types';
export type WebhookEventContext = Record<never, never>;
declare class WebhookManager {
    _eventPublisher: EventPublisher;
    _subscriptionIDsByWebhookID: Map<string, string>;
    _errorsCountByWebhookID: Map<string, number>;
    _webhookRepository: IWebhookRepository;
    _permissionManager: PermissionManager;
    constructor(eventPublisher: EventPublisher, permissionManager: PermissionManager, webhookRepository: IWebhookRepository);
    create(model: WebhookMutator): Promise<Webhook>;
    deleteByID(webhookID: string): Promise<void>;
    getAll(): Promise<Array<Webhook>>;
    getByID(webhookID: string): Promise<Webhook>;
    _init(): Promise<void>;
    _subscribeWebhook(webhook: Webhook): void;
    _unsubscribeWebhookByID(webhookID: string): void;
    _onNewWebhookEvent(webhook: Webhook): (event: ProtocolEvent<WebhookEventContext>) => Promise<void>;
    runWebhook(webhook: Webhook, event: ProtocolEvent<WebhookEventContext>): Promise<void>;
    runWebhookThrottled: import("lodash").DebouncedFunc<(webhook: Webhook, event: ProtocolEvent<WebhookEventContext>) => Promise<void>>;
    _callWebhook: (webhook: Webhook, event: ProtocolEvent<WebhookEventContext>, requestOptions: CoreOptions & UrlOptions) => Promise<string | Buffer | Record<string, unknown>>;
    _getEventVariables: (event: ProtocolEvent<WebhookEventContext>) => Record<string, unknown>;
    _getRequestData: (customData: Record<string, unknown> | undefined, event: ProtocolEvent<WebhookEventContext>, noDefaults?: boolean) => Record<string, unknown>;
    _compileTemplate: (template: string | undefined, variables: Record<string, unknown>) => string | undefined;
    _compileJsonTemplate: (template: Record<string, unknown> | undefined, variables: Record<string, unknown>) => Record<string, unknown> | undefined;
    _compileErrorResponseTopic: (webhook: Webhook, event: ProtocolEvent<WebhookEventContext>) => string;
    _incrementWebhookErrorCounter: (webhookID: string) => void;
    _resetWebhookErrorCounter: (webhookID: string) => void;
}
export default WebhookManager;
