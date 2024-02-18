import type {
  IUserRepository,
  TokenObject,
  User,
  UserCredentials,
} from '../types';

import request from 'supertest';
import ouathClients from '../oauthClients.json';
import { createTestApp } from './setup/createTestApp';
import TestData from './setup/TestData';
import nullthrows from 'nullthrows';

describe('UsersController', () => {
  const app = createTestApp();
  const container = app.container;
  let USER_CREDENTIALS: UserCredentials;
  let user: User;
  let userToken: string;

  test('should create new user', async () => {
    USER_CREDENTIALS = TestData.getUser();

    const response = await request(app)
      .post('/v1/users')
      .send(USER_CREDENTIALS);

    user = nullthrows(
      await container
        .constitute<IUserRepository>('IUserRepository')
        .getByUsername(USER_CREDENTIALS.username),
    );

    expect(response.status).toEqual(200);
    expect(user.username === USER_CREDENTIALS.username).toBeTruthy();
    expect(
      user.id && user.passwordHash && user.salt && user.created_at,
    ).toBeTruthy();
  });

  test('should throw an error if username already in use', async () => {
    const response = await request(app)
      .post('/v1/users')
      .send(USER_CREDENTIALS);
    expect(response.status).toEqual(400);
    expect(response.body.error).toEqual(
      'user with the username already exists',
    );
  });

  test('should login the user', async () => {
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
    const response = await request(app)
      .get('/v1/access_tokens')
      .auth(USER_CREDENTIALS.username, USER_CREDENTIALS.password);

    const tokens = response.body;

    expect(response.status).toEqual(200);
    expect(Array.isArray(tokens) && tokens.length > 0).toBeTruthy();
  });

  test('should delete the access token for the user', async () => {
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
    await container
      .constitute<IUserRepository>('IUserRepository')
      .deleteByID(user.id);
  });
});
