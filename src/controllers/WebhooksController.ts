import { Webhook } from '@brewskey/spark-protocol';

import httpVerb from '../decorators/httpVerb';
import route from '../decorators/route';
import HttpError from '../lib/HttpError';
import type WebhookManager from '../managers/WebhookManager';
import { MutateWebhookDTO } from '../types';
import Controller from './Controller';
import { HttpResult } from './types';

const validateMutateWebhookDTO = (
  dto: MutateWebhookDTO,
): HttpError | null | undefined => {
  if (!dto.event) {
    return new HttpError('no event name provided');
  }
  if (!dto.url) {
    return new HttpError('no url provided');
  }
  if (!dto.requestType) {
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
  async getByID(webhookID: number): Promise<HttpResult<Webhook>> {
    return this.ok(await this._webhookManager.getByID(webhookID));
  }

  @httpVerb('post')
  @route('/v1/webhooks')
  async create(model: MutateWebhookDTO): Promise<
    HttpResult<{
      created_at: Date;
      event: string;
      id: number;
      ok: true;
      url: string;
    }>
  > {
    const validateError = validateMutateWebhookDTO(model);
    if (validateError) {
      throw validateError;
    }

    const newWebhook = await this._webhookManager.create({
      ...model,
      ownerID: this.user.id,
    });

    return this.ok({
      created_at: newWebhook.createdAt,
      event: newWebhook.event,
      id: newWebhook.id,
      ok: true,
      url: newWebhook.url,
    });
  }

  @httpVerb('delete')
  @route('/v1/webhooks/:webhookID')
  async deleteByID(webhookID: number): Promise<HttpResult<{ ok: true }>> {
    await this._webhookManager.deleteByID(webhookID);
    return this.ok({ ok: true });
  }
}

export default WebhooksController;
