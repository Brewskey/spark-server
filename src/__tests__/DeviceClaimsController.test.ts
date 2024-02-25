import {
  ClaimCodeManager,
  EventPublisher,
  SPARK_SERVER_EVENTS,
} from '@brewskey/spark-protocol';
import { Container } from 'constitute';
import sinon from 'sinon';
import request from 'supertest';

import ouathClients from '../oauthClients.json';
import { AppAndContainer, createTestApp } from './setup/createTestApp';
import TestData from './setup/TestData';
import { getTestDataSource } from './setup/TestDataSource';

describe('DeviceClaimsController', () => {
  const dataSource = getTestDataSource();
  let app: AppAndContainer;
  let container: Container;
  let DEVICE_ID: string;
  let userToken: string;
  let deviceToApiAttributes: Record<string, unknown>;

  beforeAll(async () => {
    await dataSource.initialize();
    app = createTestApp(dataSource);
    container = app.container;
    const USER_CREDENTIALS = TestData.getUser();
    DEVICE_ID = TestData.getID();

    sinon
      .stub(
        container.constitute<EventPublisher>('EventPublisher'),
        'publishAndListenForResponse',
      )
      .callsFake(async ({ name }) => {
        if (name === SPARK_SERVER_EVENTS.GET_DEVICE_ATTRIBUTES) {
          return { error: new Error('Could not get device for ID') };
        }
        if (name === SPARK_SERVER_EVENTS.PING_DEVICE) {
          return {
            error: undefined,
            connected: true,
            lastHeard: new Date(),
          };
        }

        return { error: new Error('should not happen') };
      });

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

    const provisionResponse = await request(app)
      .post(`/v1/provisioning/${DEVICE_ID}`)
      .query({ access_token: userToken })
      .send({ publicKey: TestData.getPublicKey() });

    deviceToApiAttributes = provisionResponse.body;

    if (!deviceToApiAttributes.id) {
      throw new Error('test device creation fails');
    }
  });

  test("should return claimCode, and user's devices ids", async () => {
    const response = await request(app)
      .post('/v1/device_claims')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({ access_token: userToken });
    expect(response.status).toEqual(200);
    expect(response.body.claim_code).toBeTruthy();
    expect(response.body.device_ids[0]).toEqual(DEVICE_ID);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await container
      .constitute<ClaimCodeManager>('ClaimCodeManager')
      .onShutdown();
  });
});
