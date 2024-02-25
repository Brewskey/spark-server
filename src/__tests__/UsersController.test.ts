import { TokenObject, User } from '@brewskey/spark-protocol';
import { Container } from 'constitute';
import nullthrows from 'nullthrows';
import request from 'supertest';

import ouathClients from '../oauthClients.json';
import UserRepository from '../repository/UserRepository';
import type { UserCredentials } from '../types';
import { AppAndContainer, createTestApp } from './setup/createTestApp';
import TestData from './setup/TestData';
import { getTestDataSource } from './setup/TestDataSource';

describe('UsersController', () => {
  const dataSource = getTestDataSource();
  let app: AppAndContainer;
  let container: Container;
  let USER_CREDENTIALS: UserCredentials;
  let user: User;
  let userToken: string;

  beforeAll(async () => {
    await dataSource.initialize();
    app = createTestApp(dataSource);
    container = app.container;
  });

  beforeEach(() => {
    USER_CREDENTIALS = TestData.getUser();
  });

  test('should create new user', async () => {
    const response = await request(app)
      .post('/v1/users')
      .send(USER_CREDENTIALS);

    user = nullthrows(
      await container
        .constitute<UserRepository>('UserRepository')
        .getByUsernameOrFail(USER_CREDENTIALS.username),
    );

    expect(response.status).toEqual(200);
    expect(user.userName).toEqual(USER_CREDENTIALS.username);
    expect(
      user.id && user.passwordHash && user.salt && user.createdAt,
    ).toBeTruthy();
  });

  test('should throw an error if username already in use', async () => {
    await request(app).post('/v1/users').send(USER_CREDENTIALS);
    const response = await request(app)
      .post('/v1/users')
      .send(USER_CREDENTIALS);
    expect(response.status).toEqual(400);
    expect(response.body.error).toEqual(
      'user with the username already exists',
    );
  });

  test('should login the user', async () => {
    await request(app).post('/v1/users').send(USER_CREDENTIALS);
    const response = await request(app)
      .post('/oauth/token')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        client_id: ouathClients[0].clientId,
        client_secret: ouathClients[0].clientSecret,
        grant_type: 'password',
        password: USER_CREDENTIALS.password,
        username: USER_CREDENTIALS.username,
      });

    userToken = response.body.access_token;

    expect(response.status).toEqual(200);
    expect(userToken && response.body.token_type === 'Bearer').toBeTruthy();
  });

  test('should return all access tokens for the user', async () => {
    await request(app).post('/v1/users').send(USER_CREDENTIALS);
    await request(app)
      .post('/oauth/token')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        client_id: ouathClients[0].clientId,
        client_secret: ouathClients[0].clientSecret,
        grant_type: 'password',
        password: USER_CREDENTIALS.password,
        username: USER_CREDENTIALS.username,
      });

    const response = await request(app)
      .get('/v1/access_tokens')
      .auth(USER_CREDENTIALS.username, USER_CREDENTIALS.password);

    const tokens = response.body;

    expect(response.status).toEqual(200);
    expect(Array.isArray(tokens) && tokens.length > 0).toBeTruthy();
  });

  test('should delete the access token for the user', async () => {
    await request(app).post('/v1/users').send(USER_CREDENTIALS);
    const deleteResponse = await request(app)
      .delete(`/v1/access_tokens/${userToken}`)
      .auth(USER_CREDENTIALS.username, USER_CREDENTIALS.password);

    const allTokensResponse = await request(app)
      .get('/v1/access_tokens')
      .auth(USER_CREDENTIALS.username, USER_CREDENTIALS.password);

    const allTokens = allTokensResponse.body;

    expect(deleteResponse.status).toEqual(200);
    expect(
      allTokens.some(
        (tokenObject: TokenObject): boolean =>
          tokenObject.accessToken === userToken,
      ),
    ).toBeFalsy();
  });

  afterAll(async () => {
    await dataSource.destroy();
  });
});
