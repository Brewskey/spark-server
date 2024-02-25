import type {
  EventPublisher,
  ProtocolEvent,
  Webhook,
} from '@brewskey/spark-protocol';
import hogan from 'hogan.js';
import throttle from 'lodash/throttle';
import nullthrows from 'nullthrows';
import request, { CoreOptions, UrlOptions } from 'request';

import HttpError from '../lib/HttpError';
import Logger from '../lib/logger';
import WebhookRepository from '../repository/WebhookRepository';
import settings from '../settings';
import type { MutateWebhookDTO, RequestType } from '../types';
import type PermissionManager from './PermissionManager';

const logger = Logger.createModuleLogger(module);

export type WebhookEventContext = Record<never, never>;

const parseEventData = (
  event: ProtocolEvent<WebhookEventContext>,
): WebhookEventContext | null => {
  try {
    if (event.data && typeof event.data === 'string') {
      return JSON.parse(event.data);
    }
    return null;
  } catch (error) {
    return null;
  }
};

const splitBufferIntoChunks = (
  buffer: Buffer,
  chunkSize: number,
): Array<Buffer> => {
  const chunks: Buffer[] = [];
  let ii = 0;
  while (ii < buffer.length) {
    chunks.push(buffer.slice(ii, (ii += chunkSize)));
  }

  return chunks;
};

const REQUEST_TYPES: Array<RequestType> = ['DELETE', 'GET', 'POST', 'PUT'];
const MAX_WEBHOOK_ERRORS_COUNT = 10;
const WEBHOOK_THROTTLE_TIME = 1000 * 60; // 1min;
const MAX_RESPONSE_MESSAGE_CHUNK_SIZE = 512;
const MAX_RESPONSE_MESSAGE_SIZE = 100000;

const validateRequestType = (requestType: string): RequestType => {
  const upperRequestType = requestType.toUpperCase() as RequestType;
  if (!REQUEST_TYPES.includes(upperRequestType)) {
    throw new HttpError('wrong requestType');
  }

  return upperRequestType;
};

const WEBHOOK_DEFAULTS = {
  rejectUnauthorized: true,
} as const;

class WebhookManager {
  _subscriptionIDsByWebhookID: Map<number, string> = new Map();

  _errorsCountByWebhookID: Map<number, number> = new Map();

  constructor(
    private readonly eventPublisher: EventPublisher,
    private readonly permissionManager: PermissionManager,
    private readonly webhookRepository: WebhookRepository,
  ) {
    (async () => {
      await this._init();
    })();
  }

  async create({
    mydevices,
    noDefaults,
    rejectUnauthorized,
    auth,
    deviceID,
    errorResponseTopic,
    form,
    headers,
    json,
    productIdOrSlug,
    query,
    responseTemplate,
    responseTopic,
    ...model
  }: MutateWebhookDTO): Promise<Webhook> {
    const webhook = await this.webhookRepository.create({
      ...WEBHOOK_DEFAULTS,
      ...model,
      auth: auth ?? null,
      deviceID: deviceID ?? null,
      errorResponseTopic: errorResponseTopic ?? null,
      form: form ?? null,
      headers: headers ?? null,
      json: json ?? null,
      organizationID: null,
      productIdOrSlug: productIdOrSlug ?? null,
      query: query ?? null,
      responseTemplate: responseTemplate ?? null,
      responseTopic: responseTopic ?? null,
      isFromMyDevices: mydevices ?? false,
      hasNoDefaults: noDefaults ?? false,
      shouldRejectUnauthorized: rejectUnauthorized ?? false,
    });
    this._subscribeWebhook(webhook);
    return webhook;
  }

  async deleteByID(webhookID: number) {
    const webhook = await this.permissionManager.getEntityByID(
      'webhook',
      webhookID,
    );
    if (!webhook) {
      throw new HttpError('no webhook found', 404);
    }

    await this.webhookRepository.deleteByID(webhookID);
    this._unsubscribeWebhookByID(webhookID);
  }

  async getAll(): Promise<Array<Webhook>> {
    return this.permissionManager.getAllEntitiesForCurrentUser('webhook');
  }

  async getByID(webhookID: number): Promise<Webhook> {
    const webhook = await this.permissionManager.getEntityByID<Webhook>(
      'webhook',
      webhookID,
    );
    if (!webhook) {
      throw new HttpError('no webhook found', 404);
    }

    return webhook;
  }

  async _init() {
    const allWebhooks = await this.webhookRepository.find();
    allWebhooks.forEach((webhook: Webhook): void =>
      this._subscribeWebhook(webhook),
    );
  }

  _subscribeWebhook(webhook: Webhook) {
    const subscriptionID = this.eventPublisher.subscribe(
      webhook.event,
      this._onNewWebhookEvent(webhook),
      {
        filterOptions: {
          deviceID: webhook.deviceID,
          shouldListenToBroadcastedEvents: false,
          isFromMyDevices: webhook.isFromMyDevices,
          userID: webhook.ownerID,
        },
      },
    );
    this._subscriptionIDsByWebhookID.set(webhook.id, subscriptionID);
  }

  _unsubscribeWebhookByID(webhookID: number) {
    const subscriptionID = this._subscriptionIDsByWebhookID.get(webhookID);
    if (!subscriptionID) {
      return;
    }

    this.eventPublisher.unsubscribe(subscriptionID);
    this._subscriptionIDsByWebhookID.delete(webhookID);
  }

  _onNewWebhookEvent(
    webhook: Webhook,
  ): (event: ProtocolEvent<WebhookEventContext>) => Promise<void> {
    return async (event: ProtocolEvent<WebhookEventContext>) => {
      try {
        const webhookErrorCount =
          this._errorsCountByWebhookID.get(webhook.id) || 0;

        if (webhookErrorCount < MAX_WEBHOOK_ERRORS_COUNT) {
          this.runWebhook(webhook, event);
          return;
        }

        this.eventPublisher.publish(
          {
            data: 'Too many errors, webhook disabled',
            name: this._compileErrorResponseTopic(webhook, event),
            userID: event.userID,
          },
          { isPublic: false },
        );

        this.runWebhookThrottled(webhook, event);
      } catch (error) {
        logger.error(
          { deviceID: event.deviceID, err: error, event, webhook },
          'Webhook Error',
        );
      }
    };
  }

  async runWebhook(
    webhook: Webhook,
    event: ProtocolEvent<WebhookEventContext>,
  ) {
    try {
      const webhookVariablesObject = this._getEventVariables(event);

      const requestAuth = this._compileJsonTemplate(
        webhook.auth,
        webhookVariablesObject,
      );

      const requestJson = this._compileJsonTemplate(
        webhook.json,
        webhookVariablesObject,
      );

      const requestFormData = this._compileJsonTemplate(
        webhook.form,
        webhookVariablesObject,
      );

      const requestHeaders = this._compileJsonTemplate(
        webhook.headers,
        webhookVariablesObject,
      );

      const requestUrl = this._compileTemplate(
        webhook.url,
        webhookVariablesObject,
      );

      const requestQuery = this._compileJsonTemplate(
        webhook.query,
        webhookVariablesObject,
      );

      const responseTopic = this._compileTemplate(
        webhook.responseTopic,
        webhookVariablesObject,
      );

      const requestType = this._compileTemplate(
        webhook.requestType,
        webhookVariablesObject,
      );

      const isGetRequest = requestType === 'GET';

      const requestOptions: CoreOptions & UrlOptions = {
        auth: requestAuth,
        body:
          requestJson && !isGetRequest
            ? this._getRequestData(requestJson, event, webhook.hasNoDefaults)
            : undefined,
        form:
          !requestJson && !isGetRequest
            ? this._getRequestData(
                requestFormData,
                event,
                webhook.hasNoDefaults,
              ) || event.data
            : undefined,
        headers: requestHeaders,
        json: true,
        method: validateRequestType(nullthrows(requestType)),
        qs: isGetRequest
          ? this._getRequestData(requestQuery, event, webhook.hasNoDefaults)
          : requestQuery,
        strictSSL: webhook.shouldRejectUnauthorized,
        url: nullthrows(requestUrl),
      };

      const responseBody = await this._callWebhook(
        webhook,
        event,
        requestOptions,
      );

      if (!responseBody) {
        return;
      }

      const isResponseBodyAnObject =
        typeof responseBody !== 'string' && !Buffer.isBuffer(responseBody);

      const responseTemplate =
        (webhook.responseTemplate != null &&
          isResponseBodyAnObject &&
          hogan.compile(webhook.responseTemplate).render(responseBody)) ||
        '';

      const responseEventData =
        responseTemplate ||
        (isResponseBodyAnObject ? JSON.stringify(responseBody) : responseBody);

      const chunks = splitBufferIntoChunks(
        (Buffer.isBuffer(responseEventData)
          ? responseEventData
          : Buffer.from(responseEventData)
        ).slice(0, MAX_RESPONSE_MESSAGE_SIZE),
        MAX_RESPONSE_MESSAGE_CHUNK_SIZE,
      );

      chunks.forEach((chunk: Buffer, index: number) => {
        const responseEventName =
          (responseTopic && `${responseTopic}/${index}`) ||
          `hook-response/${event.name}/${index}`;

        this.eventPublisher.publish(
          {
            data: chunk.toString(),
            name: responseEventName,
            userID: event.userID,
          },
          {
            isPublic: false,
          },
        );
      });

      logger.info(
        {
          deviceID: event.deviceID,
          event,
          name: webhook.event,
          requestOptions,
          responseBody,
          responseEventData,
          webhook,
        },
        'Webhook',
      );
    } catch (error) {
      logger.error(
        { deviceID: event.deviceID, err: error, event, webhook },
        'Webhook Error',
      );
    }
  }

  runWebhookThrottled = throttle(
    this.runWebhook.bind(this),
    WEBHOOK_THROTTLE_TIME,
    {
      leading: false,
      trailing: true,
    },
  );

  _callWebhook = (
    webhook: Webhook,
    event: ProtocolEvent<WebhookEventContext>,
    requestOptions: CoreOptions & UrlOptions,
  ): Promise<string | Buffer | Record<string, unknown>> =>
    new Promise(
      (
        resolve: (
          responseBody: string | Buffer | Record<string, unknown>,
        ) => void,
        reject: (error: Error) => void,
      ): request.Request => {
        const onResponseError = (
          responseError: Error & { errorMessage?: string },
        ) => {
          this._incrementWebhookErrorCounter(webhook.id);

          this.eventPublisher.publish(
            {
              data:
                responseError != null
                  ? responseError.message ||
                    (responseError as { errorMessage: string }).errorMessage ||
                    ''
                  : '',
              name: this._compileErrorResponseTopic(webhook, event),
              userID: event.userID,
            },
            {
              isPublic: false,
            },
          );

          reject(responseError);
        };

        return request(
          requestOptions,
          (
            error: (Error & { errorMessage?: string }) | null | undefined,
            response: request.Response,
            responseBody: string | Buffer | Record<string, unknown>,
          ) => {
            if (error) {
              onResponseError(error);
              return;
            }
            if (response.statusCode >= 400) {
              onResponseError(error || new Error(response.statusMessage));
              return;
            }

            this._resetWebhookErrorCounter(webhook.id);

            this.eventPublisher.publish(
              {
                name: `hook-sent/${event.name}`,
                userID: event.userID,
              },
              {
                isPublic: false,
              },
            );

            resolve(responseBody);
          },
        );
      },
    );

  _getEventVariables = (
    event: ProtocolEvent<WebhookEventContext>,
  ): Record<string, unknown> => {
    const defaultWebhookVariables = {
      PARTICLE_DEVICE_ID: event.deviceID,
      PARTICLE_EVENT_NAME: event.name,
      PARTICLE_EVENT_VALUE: event.data,
      PARTICLE_PUBLISHED_AT: event.publishedAt,
      // old event names, added for compatibility
      SPARK_CORE_ID: event.deviceID,
      SPARK_EVENT_NAME: event.name,
      SPARK_EVENT_VALUE: event.data,
      SPARK_PUBLISHED_AT: event.publishedAt,
      ...settings.WEBHOOK_TEMPLATE_PARAMETERS,
    } as const;

    const eventDataVariables = parseEventData(event);

    return {
      ...defaultWebhookVariables,
      ...eventDataVariables,
    };
  };

  _getRequestData = (
    customData: Record<string, unknown> | undefined,
    event: ProtocolEvent<WebhookEventContext>,
    noDefaults?: boolean,
  ): Record<string, unknown> => {
    const defaultEventData = {
      coreid: event.deviceID,
      data: event.data,
      event: event.name,
      published_at: event.publishedAt,
    } as const;

    return noDefaults
      ? customData ?? {}
      : { ...defaultEventData, ...(customData || {}) };
  };

  _compileTemplate = (
    template: string | null,
    variables: Record<string, unknown>,
  ): string | undefined =>
    template != null ? hogan.compile(template).render(variables) : undefined;

  _compileJsonTemplate = (
    template: Record<string, unknown> | null,
    variables: Record<string, unknown>,
  ): Record<string, unknown> | undefined => {
    if (!template) {
      return undefined;
    }

    const compiledTemplate = this._compileTemplate(
      JSON.stringify(template),
      variables,
    );
    if (!compiledTemplate) {
      return undefined;
    }

    return JSON.parse(compiledTemplate);
  };

  _compileErrorResponseTopic = (
    webhook: Webhook,
    event: ProtocolEvent<WebhookEventContext>,
  ): string => {
    const variables = this._getEventVariables(event);
    return (
      this._compileTemplate(webhook.errorResponseTopic, variables) ||
      `hook-error/${event.name}`
    );
  };

  _incrementWebhookErrorCounter(webhookID: number) {
    const errorsCount = this._errorsCountByWebhookID.get(webhookID) || 0;
    this._errorsCountByWebhookID.set(webhookID, errorsCount + 1);
  }

  _resetWebhookErrorCounter(webhookID: number) {
    this._errorsCountByWebhookID.set(webhookID, 0);
  }
}

export default WebhookManager;
