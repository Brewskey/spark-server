import type { Webhook, WebhookMutator } from '../types';
import type WebhookManager from '../managers/WebhookManager';

import Controller from './Controller';
import HttpError from '../lib/HttpError';
import httpVerb from '../decorators/httpVerb';
import route from '../decorators/route';
import { HttpResult } from './types';

const validateWebhookMutator = (
  webhookMutator: WebhookMutator,
): HttpError | null | undefined => {
  if (!webhookMutator.event) {
    return new HttpError('no event name provided');
  }
  if (!webhookMutator.url) {
    return new HttpError('no url provided');
  }
  if (!webhookMutator.requestType) {
    return new HttpError('no requestType provided');
  }

  return null;
};

class WebhooksController extends Controller {
  _webhookManager: WebhookManager;

  constructor(webhookManager: WebhookManager) {
    super();

    this._webhookManager = webhookManager;
  }

  @httpVerb('get')
  @route('/v1/webhooks')
  async getAll(): Promise<HttpResult<Webhook[]>> {
    return this.ok(await this._webhookManager.getAll());
  }

  @httpVerb('get')
  @route('/v1/webhooks/:webhookID')
  async getByID(webhookID: string): Promise<HttpResult<Webhook>> {
    return this.ok(await this._webhookManager.getByID(webhookID));
  }

  @httpVerb('post')
  @route('/v1/webhooks')
  async create(model: WebhookMutator): Promise<
    HttpResult<{
      created_at: Date;
      event: string;
      id: string;
      ok: true;
      url: string;
    }>
  > {
    const validateError = validateWebhookMutator(model);
    if (validateError) {
      throw validateError;
    }

    const newWebhook = await this._webhookManager.create({
      ...model,
      ownerID: this.user.id,
    });

    return this.ok({
      created_at: newWebhook.created_at,
      event: newWebhook.event,
      id: newWebhook.id,
      ok: true,
      url: newWebhook.url,
    });
  }

  @httpVerb('delete')
  @route('/v1/webhooks/:webhookID')
  async deleteByID(webhookID: string): Promise<HttpResult<{ ok: true }>> {
    await this._webhookManager.deleteByID(webhookID);
    return this.ok({ ok: true });
  }
}

export default WebhooksController;
