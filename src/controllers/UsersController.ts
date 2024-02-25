import { TokenObject } from '@brewskey/spark-protocol';
import basicAuthParser from 'basic-auth-parser';

import anonymous from '../decorators/anonymous';
import httpVerb from '../decorators/httpVerb';
import route from '../decorators/route';
import HttpError from '../lib/HttpError';
import UserRepository from '../repository/UserRepository';
import type { UserCredentials } from '../types';
import Controller from './Controller';
import { HttpResult } from './types';

class UsersController extends Controller {
  _userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    super();
    this._userRepository = userRepository;
  }

  @httpVerb('post')
  @route('/v1/users')
  @anonymous()
  async createUser(
    userCredentials: UserCredentials,
  ): Promise<HttpResult<{ ok: boolean }>> {
    try {
      const isUserNameInUse = await this._userRepository.isUserNameInUse(
        userCredentials.username,
      );

      if (isUserNameInUse) {
        throw new HttpError('user with the username already exists');
      }

      await this._userRepository.createWithCredentials(userCredentials);

      return this.ok({ ok: true });
    } catch (error) {
      return this.bad(error);
    }
  }

  @httpVerb('delete')
  @route('/v1/access_tokens/:token')
  @anonymous()
  async deleteAccessToken(token: string): Promise<HttpResult<{ ok: boolean }>> {
    const { username, password } = basicAuthParser(
      this.request.get('authorization'),
    );
    const user = await this._userRepository.validateLogin(username, password);

    await this._userRepository.deleteAccessToken(user.id, token);

    return this.ok({ ok: true });
  }

  @httpVerb('get')
  @route('/v1/access_tokens')
  @anonymous()
  async getAccessTokens(): Promise<HttpResult<TokenObject[]>> {
    const { username, password } = basicAuthParser(
      this.request.get('authorization'),
    );
    const user = await this._userRepository.validateLogin(username, password);
    return this.ok(user.accessTokens);
  }
}

export default UsersController;
