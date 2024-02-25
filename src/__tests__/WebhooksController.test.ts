import { Webhook } from '@brewskey/spark-protocol';
import request from 'supertest';

import ouathClients from '../oauthClients.json';
import { MutateWebhookDTO } from '../types';
import { AppAndContainer, createTestApp } from './setup/createTestApp';
import TestData from './setup/TestData';
import { getTestDataSource } from './setup/TestDataSource';

describe('WebhookController', () => {
  const dataSource = getTestDataSource();
  let app: AppAndContainer;
  const WEBHOOK_MODEL: MutateWebhookDTO = {
    event: 'testEvent',
    requestType: 'GET',
    url: 'http://webhooktest.com/',
    ownerID: 1,
  };

  let userToken: string;

  beforeAll(async () => {
    await dataSource.initialize();
    app = createTestApp(dataSource);
    const USER_CREDENTIALS = TestData.getUser();
    await request(app).post('/v1/users').send(USER_CREDENTIALS);

    const tokenResponse = await request(app)
      .post('/oauth/token')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        client_id: ouathClients[0].clientId,
        client_secret: ouathClients[0].clientSecret,
        grant_type: 'password',
        password: USER_CREDENTIALS.password,
        username: USER_CREDENTIALS.username,
      });

    userToken = tokenResponse.body.access_token;

    if (!userToken) {
      throw new Error('test user creation fails');
    }
  });

  test('should create a new webhook object', async () => {
    const response = await request(app)
      .post('/v1/webhooks')
      .query({ access_token: userToken })
      .send({
        event: WEBHOOK_MODEL.event,
        requestType: WEBHOOK_MODEL.requestType,
        url: WEBHOOK_MODEL.url,
      });

    const testWebhook = response.body;

    expect(response.status).toEqual(200);
    expect(testWebhook.id && testWebhook.event && testWebhook.url).toBeTruthy();
  });

  test("should throw an error if event isn't provided", async () => {
    const response = await request(app)
      .post('/v1/webhooks')
      .query({ access_token: userToken })
      .send({
        requestType: WEBHOOK_MODEL.requestType,
        url: WEBHOOK_MODEL.url,
      });

    expect(response.status).toEqual(400);
    expect(response.body.error).toEqual('no event name provided');
  });

  test("should throw an error if url isn't provided", async () => {
    const response = await request(app)
      .post('/v1/webhooks')
      .query({ access_token: userToken })
      .send({
        event: WEBHOOK_MODEL.event,
        requestType: WEBHOOK_MODEL.requestType,
      });

    expect(response.status).toEqual(400);
    expect(response.body.error).toEqual('no url provided');
  });

  test("should throw an error if requestType isn't provided", async () => {
    const response = await request(app)
      .post('/v1/webhooks')
      .query({ access_token: userToken })
      .send({
        event: WEBHOOK_MODEL.event,
        url: WEBHOOK_MODEL.url,
      });

    expect(response.status).toEqual(400);
    expect(response.body.error).toEqual('no requestType provided');
  });

  test('should return all webhooks', async () => {
    const response = await request(app)
      .get('/v1/webhooks')
      .query({ access_token: userToken });

    const webhooks = response.body;

    expect(response.status).toEqual(200);
    expect(Array.isArray(webhooks) && webhooks.length > 0).toBeTruthy();
  });

  test('should return webhook object by id', async () => {
    const { body: testWebhook } = await request(app)
      .post('/v1/webhooks')
      .query({ access_token: userToken })
      .send({
        event: WEBHOOK_MODEL.event,
        requestType: WEBHOOK_MODEL.requestType,
        url: WEBHOOK_MODEL.url,
      });

    const response = await request(app)
      .get(`/v1/webhooks/${testWebhook.id}`)
      .query({ access_token: userToken });

    expect(response.status).toEqual(200);
    expect(testWebhook.id).toEqual(response.body.id);
    expect(testWebhook.event).toEqual(response.body.event);
    expect(testWebhook.url).toEqual(response.body.url);
  });

  test('should delete webhook', async () => {
    const { body: testWebhook } = await request(app)
      .post('/v1/webhooks')
      .query({ access_token: userToken })
      .send({
        event: WEBHOOK_MODEL.event,
        requestType: WEBHOOK_MODEL.requestType,
        url: WEBHOOK_MODEL.url,
      });

    const deleteResponse = await request(app)
      .delete(`/v1/webhooks/${testWebhook.id}`)
      .query({ access_token: userToken });

    expect(deleteResponse.status).toEqual(200);

    const allWebhooksResponse = await request(app)
      .get('/v1/webhooks')
      .query({ access_token: userToken });

    expect(allWebhooksResponse.status).toEqual(200);

    const webhooks = allWebhooksResponse.body;

    expect(
      webhooks.some(
        (webhook: Webhook): boolean => webhook.id === testWebhook.id,
      ),
    ).toBeFalsy();
  });
});
