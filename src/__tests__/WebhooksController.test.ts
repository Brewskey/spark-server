/* eslint-disable */
import type {
  IUserRepository,
  IWebhookRepository,
  User,
  Webhook,
  WebhookMutator,
} from '../types';

import request from 'supertest';
import ouathClients from '../oauthClients.json';
import { createTestApp } from './setup/createTestApp';
import TestData from './setup/TestData';
import nullthrows from 'nullthrows';

describe('WebhookController', () => {
  const app = createTestApp();
  const container = app.container;
  const WEBHOOK_MODEL: WebhookMutator = {
    event: 'testEvent',
    requestType: 'GET',
    url: 'http://webhooktest.com/',
    ownerID: 'test-owner-id',
  };

  let testUser: User;
  let userToken: string;
  let testWebhook: Webhook;

  beforeAll(async () => {
    const USER_CREDENTIALS = TestData.getUser();
    const userResponse = await request(app)
      .post('/v1/users')
      .send(USER_CREDENTIALS);

    testUser = nullthrows(
      await container
        .constitute<IUserRepository>('IUserRepository')
        .getByUsername(USER_CREDENTIALS.username),
    );

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

    testWebhook = response.body;

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
    const response = await request(app)
      .get(`/v1/webhooks/${testWebhook.id}`)
      .query({ access_token: userToken });

    expect(response.status).toEqual(200);
    expect(testWebhook.id).toEqual(response.body.id);
    expect(testWebhook.event).toEqual(response.body.event);
    expect(testWebhook.url).toEqual(response.body.url);
  });

  test('should delete webhook', async () => {
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

  afterAll(async () => {
    await container
      .constitute<IWebhookRepository>('IWebhookRepository')
      .deleteByID(testWebhook.id);
    await container
      .constitute<IUserRepository>('IUserRepository')
      .deleteByID(testUser.id);
  });
});
