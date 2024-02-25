import { TokenObject, User } from '@brewskey/spark-protocol';

import oauthClients from './oauthClients.json';
import UserRepository from './repository/UserRepository';
import type { Client } from './types';

const OAUTH_CLIENTS = oauthClients as Client[];

type AccessToken = {
  accessToken: string;
  accessTokenExpiresAt: Date;
  clientId: string;
  refreshToken?: string;
  refreshTokenExpiresAt: Date | undefined;
  userId: number;
  user: User;
};

class OauthModel {
  _userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this._userRepository = userRepository;
  }

  getAccessToken = async (
    bearerToken: string,
  ): Promise<AccessToken | null | undefined> => {
    const user = await this._userRepository.getByAccessToken(bearerToken);
    if (!user) {
      return null;
    }

    const userTokenObject = user.accessTokens.find(
      (tokenObject: TokenObject): boolean =>
        tokenObject.accessToken === bearerToken,
    );

    if (!userTokenObject) {
      return null;
    }

    return {
      ...userTokenObject,
      accessTokenExpiresAt: new Date(userTokenObject.accessTokenExpiresAt),
      refreshTokenExpiresAt: userTokenObject.refreshTokenExpiresAt
        ? new Date(userTokenObject.refreshTokenExpiresAt)
        : undefined,
      clientId: 'spark-server',
      user,
      userId: user.id,
    };
  };

  getClient = (clientId: string, clientSecret: string): Client | undefined =>
    OAUTH_CLIENTS.find(
      (client: Client): boolean =>
        client.clientId === clientId && client.clientSecret === clientSecret,
    );

  getUser: (username: string, password: string) => Promise<User> = async (
    username: string,
    password: string,
  ): Promise<User> => this._userRepository.validateLogin(username, password);

  saveToken = async (
    tokenObject: TokenObject,
    client: Client,
    user: User,
  ): Promise<{
    accessToken: string;
    client: Client;
    user: User;
  }> => {
    await this._userRepository.saveAccessToken(user.id, tokenObject);
    return {
      accessToken: tokenObject.accessToken,
      client,
      user,
    };
  };

  // eslint-disable-next-line no-unused-vars
  validateScope: (user: User, client: Client, scope: string) => string =
    (): string => 'true';
}

export default OauthModel;
