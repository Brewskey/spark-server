import request from 'supertest';
import sinon from 'sinon';
import ouathClients from '../oauthClients.json';
import { createTestApp } from './setup/createTestApp';
import TestData from './setup/TestData';
import {
  EventPublisher,
  IDeviceAttributeRepository,
  IDeviceKeyRepository,
  SPARK_SERVER_EVENTS,
} from '@brewskey/spark-protocol';
import { IUserRepository, User } from '../types';
import nullthrows from 'nullthrows';

describe('ProvisioningController', () => {
  const app = createTestApp();
  const container = app.container;
  let DEVICE_ID: string;
  let TEST_PUBLIC_KEY: string;
  let testUser: User;
  let userToken: string;

  beforeAll(async () => {
    const USER_CREDENTIALS = TestData.getUser();
    DEVICE_ID = TestData.getID();
    TEST_PUBLIC_KEY = TestData.getPublicKey();

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
            connected: true,
            lastHeard: new Date(),
          };
        }
        return { error: new Error() };
      });

    await request(app).post('/v1/users').send(USER_CREDENTIALS);

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

  test('provision and add keys for a device.', async () => {
    const response = await request(app)
      .post(`/v1/provisioning/${DEVICE_ID}`)
      .query({ access_token: userToken })
      .send({ publicKey: TEST_PUBLIC_KEY });

    expect(response.status).toEqual(200);
    expect(response.body.id).toEqual(DEVICE_ID);
  });

  test('should throw an error if public key has wrong format', async () => {
    const response = await request(app)
      .post(`/v1/provisioning/${DEVICE_ID}`)
      .query({ access_token: userToken })
      .send({ publicKey: 'dsfsdf13' });

    expect(response.status).toEqual(400);
    expect(response.body.error).toBeDefined();
  });

  test('should throw an error if public key is not provided', async () => {
    const response = await request(app)
      .post(`/v1/provisioning/${DEVICE_ID}`)
      .query({ access_token: userToken });

    expect(response.status).toEqual(400);
    expect(response.body.error).toEqual('No key provided');
  });

  afterAll(async () => {
    await container
      .constitute<IUserRepository>('IUserRepository')
      .deleteByID(testUser.id);
    await container
      .constitute<IDeviceAttributeRepository>('IDeviceAttributeRepository')
      .deleteByID(DEVICE_ID);
    await container
      .constitute<IDeviceKeyRepository>('IDeviceKeyRepository')
      .deleteByID(DEVICE_ID);
  });
});
