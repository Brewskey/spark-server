import type { Webhook } from '../types';

import sinon from 'sinon';

import { EventPublisher, ProtocolEvent } from 'spark-protocol';
import WebhookFileRepository from '../repository/WebhookFileRepository';
import WebhookManager, {
  WebhookEventContext,
} from '../managers/WebhookManager';
import TestData from './setup/TestData';
import PermissionManager from '../managers/PermissionManager';
import { CoreOptions, UrlOptions } from 'request';

const WEBHOOK_BASE: Webhook = {
  event: 'test-event',
  requestType: 'POST',
  url: 'https://webhook-test.com/67fcfefd07229639ddc49a1ba71816f2',
  created_at: new Date(),
  id: 'test-id',
  ownerID: 'test-owner-id',
};

const getEvent = (data?: string): ProtocolEvent<WebhookEventContext> => ({
  data,
  deviceID: TestData.getID(),
  name: 'test-event',
  publishedAt: new Date(),
  ttl: 60,
  userID: TestData.getID(),
  isPublic: false,
  isInternal: false,
});

const getDefaultRequestData = <TData>(
  event: ProtocolEvent<TData>,
): Record<string, unknown> => ({
  coreid: event.deviceID,
  data: event.data,
  event: event.name,
  published_at: event.publishedAt,
});

describe('WebhookManager', () => {
  let repository: WebhookFileRepository;
  let eventPublisher: EventPublisher;
  const permissionManager: PermissionManager = Object.create(PermissionManager);

  beforeAll(() => {
    repository = new WebhookFileRepository('');
    repository.getAll = sinon.stub().returns([]);
    eventPublisher = new EventPublisher();
    eventPublisher.publish = sinon.stub();
  });

  test('should run basic request', async () => {
    const manager = new WebhookManager(
      eventPublisher,
      permissionManager,
      repository,
    );
    const data = 'testData';
    const event = getEvent(data);
    const defaultRequestData = getDefaultRequestData(event);

    manager._callWebhook = sinon.spy(
      async (
        _webhook: Webhook,
        _event: ProtocolEvent<unknown>,
        requestOptions: CoreOptions & UrlOptions,
      ): Promise<string | Buffer | Record<string, unknown>> => {
        expect(requestOptions.auth).toBeUndefined();
        expect(requestOptions.body).toBeUndefined();
        expect(JSON.stringify(requestOptions.form)).toEqual(
          JSON.stringify(defaultRequestData),
        );
        expect(requestOptions.headers).toBeUndefined();
        expect(requestOptions.method).toEqual(WEBHOOK_BASE.requestType);
        expect(requestOptions.qs).toBeUndefined();
        expect(requestOptions.url).toEqual(WEBHOOK_BASE.url);
        return {};
      },
    );

    await manager.runWebhook(WEBHOOK_BASE, event);
  });

  test('should run basic request without default data', async () => {
    const manager = new WebhookManager(
      eventPublisher,
      permissionManager,
      repository,
    );
    const webhook = {
      ...WEBHOOK_BASE,
      noDefaults: true,
    };
    const data = 'testData';
    const event = getEvent(data);

    manager._callWebhook = sinon.spy(
      async (
        _webhook: Webhook,
        _event: ProtocolEvent<unknown>,
        requestOptions: CoreOptions & UrlOptions,
      ): Promise<string | Buffer | Record<string, unknown>> => {
        expect(requestOptions.auth).toBeUndefined();
        expect(requestOptions.body).toBeUndefined();
        expect(requestOptions.form).toEqual(data);
        expect(requestOptions.headers).toBeUndefined();
        expect(requestOptions.method).toEqual(WEBHOOK_BASE.requestType);
        expect(requestOptions.qs).toBeUndefined();
        expect(requestOptions.url).toEqual(WEBHOOK_BASE.url);
        return {};
      },
    );

    await manager.runWebhook(webhook, event);
  });

  test('should compile json body', async () => {
    const manager = new WebhookManager(
      eventPublisher,
      permissionManager,
      repository,
    );
    const data = '{"t":"123"}';
    const event = getEvent(data);
    const webhook = {
      ...WEBHOOK_BASE,
      json: {
        testValue: '{{t}}',
      },
    };
    const defaultRequestData = getDefaultRequestData(event);

    manager._callWebhook = sinon.spy(
      async (
        _webhook: Webhook,
        _event: ProtocolEvent<unknown>,
        requestOptions: CoreOptions & UrlOptions,
      ): Promise<string | Buffer | Record<string, unknown>> => {
        expect(requestOptions.auth).toBeUndefined();
        expect(JSON.stringify(requestOptions.body)).toEqual(
          JSON.stringify({ ...defaultRequestData, testValue: '123' }),
        );
        expect(requestOptions.form).toBeUndefined();
        expect(requestOptions.headers).toBeUndefined();
        expect(requestOptions.method).toEqual(WEBHOOK_BASE.requestType);
        expect(requestOptions.qs).toBeUndefined();
        expect(requestOptions.url).toEqual(WEBHOOK_BASE.url);
        return {};
      },
    );

    await manager.runWebhook(webhook, event);
  });

  test('should compile form body', async () => {
    const manager = new WebhookManager(
      eventPublisher,
      permissionManager,
      repository,
    );
    const data = '{"t":"123","g": "foo bar"}';
    const event = getEvent(data);
    const webhook = {
      ...WEBHOOK_BASE,
      form: {
        testValue: '{{t}}',
        testValue2: '{{g}}',
      },
    };
    const defaultRequestData = getDefaultRequestData(event);

    manager._callWebhook = sinon.spy(
      async (
        _webhook: Webhook,
        _event: ProtocolEvent<unknown>,
        requestOptions: CoreOptions & UrlOptions,
      ): Promise<string | Buffer | Record<string, unknown>> => {
        expect(requestOptions.auth).toBeUndefined();
        expect(requestOptions.body).toBeUndefined();
        expect(JSON.stringify(requestOptions.form)).toEqual(
          JSON.stringify({
            ...defaultRequestData,
            testValue: '123',
            testValue2: 'foo bar',
          }),
        );
        expect(requestOptions.headers).toBeUndefined();
        expect(requestOptions.method).toEqual(WEBHOOK_BASE.requestType);
        expect(requestOptions.qs).toBeUndefined();
        expect(requestOptions.url).toEqual(WEBHOOK_BASE.url);
        return {};
      },
    );

    await manager.runWebhook(webhook, event);
  });

  test('should compile request auth header', async () => {
    const manager = new WebhookManager(
      eventPublisher,
      permissionManager,
      repository,
    );
    const data = '{"username":"123","password": "foobar"}';
    const event = getEvent(data);
    const webhook = {
      ...WEBHOOK_BASE,
      auth: {
        username: '{{username}}',
        password: '{{password}}',
      },
    };
    const defaultRequestData = getDefaultRequestData(event);

    manager._callWebhook = sinon.spy(
      async (
        _webhook: Webhook,
        _event: ProtocolEvent<unknown>,
        requestOptions: CoreOptions & UrlOptions,
      ): Promise<string | Buffer | Record<string, unknown>> => {
        expect(JSON.stringify(requestOptions.auth)).toEqual(
          JSON.stringify({
            username: '123',
            password: 'foobar',
          }),
        );
        expect(requestOptions.body).toBeUndefined();
        expect(JSON.stringify(requestOptions.form)).toEqual(
          JSON.stringify(defaultRequestData),
        );
        expect(requestOptions.headers).toBeUndefined();
        expect(requestOptions.method).toEqual(WEBHOOK_BASE.requestType);
        expect(requestOptions.url).toEqual(WEBHOOK_BASE.url);
        return {};
      },
    );

    await manager.runWebhook(webhook, event);
  });

  test('should compile request headers', async () => {
    const manager = new WebhookManager(
      eventPublisher,
      permissionManager,
      repository,
    );
    const data = '{"t":"123","g": "foobar"}';
    const event = getEvent(data);
    const webhook = {
      ...WEBHOOK_BASE,
      headers: {
        testHeader1: '{{t}}',
        testHeader2: '{{g}}',
      },
    };
    const defaultRequestData = getDefaultRequestData(event);

    manager._callWebhook = sinon.spy(
      async (
        _webhook: Webhook,
        _event: ProtocolEvent<unknown>,
        requestOptions: CoreOptions & UrlOptions,
      ): Promise<string | Buffer | Record<string, unknown>> => {
        expect(requestOptions.auth).toBeUndefined();
        expect(requestOptions.body).toBeUndefined();
        expect(JSON.stringify(requestOptions.form)).toEqual(
          JSON.stringify(defaultRequestData),
        );
        expect(JSON.stringify(requestOptions.headers)).toEqual(
          JSON.stringify({
            testHeader1: '123',
            testHeader2: 'foobar',
          }),
        );
        expect(requestOptions.method).toEqual(WEBHOOK_BASE.requestType);
        expect(requestOptions.url).toEqual(WEBHOOK_BASE.url);
        return {};
      },
    );

    await manager.runWebhook(webhook, event);
  });

  test('should compile request url', async () => {
    const manager = new WebhookManager(
      eventPublisher,
      permissionManager,
      repository,
    );
    const data = '{"t":"123","g": "foobar"}';
    const event = getEvent(data);
    const webhook = {
      ...WEBHOOK_BASE,
      url: 'https://webhook-test.com/67fcfefd07229639ddc49a1ba71816f2/{{t}}/{{g}}',
    };
    const defaultRequestData = getDefaultRequestData(event);

    manager._callWebhook = sinon.spy(
      async (
        _webhook: Webhook,
        _event: ProtocolEvent<unknown>,
        requestOptions: CoreOptions & UrlOptions,
      ): Promise<string | Buffer | Record<string, unknown>> => {
        expect(requestOptions.auth).toBeUndefined();
        expect(requestOptions.body).toBeUndefined();
        expect(JSON.stringify(requestOptions.form)).toEqual(
          JSON.stringify(defaultRequestData),
        );
        expect(requestOptions.headers).toBeUndefined();
        expect(requestOptions.method).toEqual(WEBHOOK_BASE.requestType);
        expect(requestOptions.qs).toBeUndefined();
        expect(requestOptions.url).toEqual('https://test.com/123/foobar');
        return {};
      },
    );

    await manager.runWebhook(webhook, event);
  });

  test('should compile request query', async () => {
    const manager = new WebhookManager(
      eventPublisher,
      permissionManager,
      repository,
    );
    const data = '{"t":"123","g": "foobar"}';
    const event = getEvent(data);
    const webhook = {
      ...WEBHOOK_BASE,
      query: {
        testValue: '{{t}}',
        testValue2: '{{g}}',
      },
    };
    const defaultRequestData = getDefaultRequestData(event);

    manager._callWebhook = sinon.spy(
      async (
        _webhook: Webhook,
        _event: ProtocolEvent<unknown>,
        requestOptions: CoreOptions & UrlOptions,
      ): Promise<string | Buffer | Record<string, unknown>> => {
        expect(requestOptions.auth).toBeUndefined();
        expect(requestOptions.body).toBeUndefined();
        expect(JSON.stringify(requestOptions.form)).toEqual(
          JSON.stringify(defaultRequestData),
        );
        expect(requestOptions.headers).toBeUndefined();
        expect(requestOptions.method).toEqual(WEBHOOK_BASE.requestType);
        expect(JSON.stringify(requestOptions.qs)).toEqual(
          JSON.stringify({ testValue: '123', testValue2: 'foobar' }),
        );
        expect(requestOptions.url).toEqual(WEBHOOK_BASE.url);
        return {};
      },
    );

    await manager.runWebhook(webhook, event);
  });

  test('should compile requestType', async () => {
    const manager = new WebhookManager(
      eventPublisher,
      permissionManager,
      repository,
    );
    const data = '{"t":"123","requestType": "post"}';
    const event = getEvent(data);
    const webhook = {
      ...WEBHOOK_BASE,
      requestType: '{{requestType}}',
    };
    const defaultRequestData = getDefaultRequestData(event);

    manager._callWebhook = sinon.spy(
      async (
        _webhook: Webhook,
        _event: ProtocolEvent<unknown>,
        requestOptions: CoreOptions & UrlOptions,
      ): Promise<string | Buffer | Record<string, unknown>> => {
        expect(requestOptions.auth).toBeUndefined();
        expect(requestOptions.body).toBeUndefined();
        expect(JSON.stringify(requestOptions.form)).toEqual(
          JSON.stringify(defaultRequestData),
        );
        expect(requestOptions.headers).toBeUndefined();
        expect(requestOptions.method).toEqual('POST');
        expect(requestOptions.url).toEqual(WEBHOOK_BASE.url);
        return {};
      },
    );

    await manager.runWebhook(webhook, event);
  });

  test('should throw an error if wrong requestType is provided', async () => {
    const manager = new WebhookManager(
      eventPublisher,
      permissionManager,
      repository,
    );
    const testRequestType = 'wrongRequestType';
    const data = `{"t":"123","requestType": "${testRequestType}"}`;
    const event = getEvent(data);
    const webhook = {
      ...WEBHOOK_BASE,
      requestType: '{{requestType}}',
    };

    // Logger.error = sinon.spy((message: string) => {
    //   expect(message).toEqual('webhookError: Error: wrong requestType');
    // });

    await manager.runWebhook(webhook, event);
    expect(true).toBeTruthy();
  });

  test('should publish sent event', async () => {
    const manager = new WebhookManager(
      eventPublisher,
      permissionManager,
      repository,
    );
    const event = getEvent();

    eventPublisher.publish = sinon.spy(({ data, name, userID }) => {
      expect(data).toBeUndefined();
      expect(name).toEqual(`hook-sent/${event.name}`);
      expect(userID).toEqual(event.userID);
    });

    await manager.runWebhook(WEBHOOK_BASE, event);
    expect(true).toBeTruthy();
  });

  test('should publish default topic', async () => {
    const manager = new WebhookManager(
      eventPublisher,
      permissionManager,
      repository,
    );
    const event = getEvent();
    manager._callWebhook = sinon.stub().returns('data');

    eventPublisher.publish = sinon.spy(({ data, name, userID }) => {
      expect(data.toString()).toEqual('data');
      expect(name).toEqual(`hook-response/${event.name}/0`);
      expect(userID).toEqual(event.userID);
    });

    await manager.runWebhook(WEBHOOK_BASE, event);
  });

  test('should compile response topic and publish', async () => {
    const manager = new WebhookManager(
      eventPublisher,
      permissionManager,
      repository,
    );
    const event = getEvent();
    const webhook = {
      ...WEBHOOK_BASE,
      responseTopic: 'hook-response/tappt_request-pour-{{SPARK_CORE_ID}}',
    };
    manager._callWebhook = sinon.stub().returns('data');

    eventPublisher.publish = sinon.spy(({ data, name, userID }) => {
      expect(data.toString()).toEqual('data');
      expect(name).toEqual(
        `hook-response/tappt_request-pour-${event.deviceID}/0`,
      );
      expect(userID).toEqual(event.userID);
    });

    await manager.runWebhook(webhook, event);
  });

  test('should compile response body and publish', async () => {
    const manager = new WebhookManager(
      eventPublisher,
      permissionManager,
      repository,
    );
    const event = getEvent();
    const webhook = {
      ...WEBHOOK_BASE,
      responseTemplate: 'testVar: {{t}}, testVar2: {{g}}',
    };
    manager._callWebhook = sinon.stub().returns({
      g: 'foobar',
      t: 123,
    });

    eventPublisher.publish = sinon.spy(({ data, name, userID }) => {
      expect(data.toString()).toEqual('testVar: 123, testVar2: foobar');
      expect(name).toEqual(`hook-response/${event.name}/0`);
      expect(userID).toEqual(event.userID);
    });

    await manager.runWebhook(webhook, event);
  });
});
