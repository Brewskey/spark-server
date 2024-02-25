import {
  DeviceAttributeRepository,
  DeviceAttributes,
  User,
  UserRole,
  Webhook,
} from '@brewskey/spark-protocol';
import ExpressOAuthServer from 'express-oauth-server';
import nullthrows from 'nullthrows';
import { Request, Response } from 'oauth2-server';
import { FindManyOptions } from 'typeorm';

import HttpError from '../lib/HttpError';
import Logger from '../lib/logger';
import OrganizationRepository from '../repository/OrganizationRepository';
import UserRepository from '../repository/UserRepository';
import WebhookRepository from '../repository/WebhookRepository';
import settings from '../settings';
import type { ProtectedEntityName } from '../types';

const logger = Logger.createModuleLogger(module);

class PermissionManager {
  _organizationRepository: OrganizationRepository;

  _userRepository: UserRepository;

  _repositoriesByEntityName: Map<
    ProtectedEntityName,
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findOneByIDOrFail: (id: any) => Promise<unknown>;
      find(
        options?: FindManyOptions<{ ownerID: number }> | undefined,
      ): Promise<unknown[]>;
    }
  > = new Map();

  _oauthServer: ExpressOAuthServer;

  constructor(
    deviceAttributeRepository: DeviceAttributeRepository,
    organizationRepository: OrganizationRepository,
    userRepository: UserRepository,
    webhookRepository: WebhookRepository,
    oauthServer: ExpressOAuthServer,
  ) {
    this._organizationRepository = organizationRepository;
    this._userRepository = userRepository;
    this._repositoriesByEntityName.set(
      'deviceAttributes',
      deviceAttributeRepository,
    );
    this._repositoriesByEntityName.set('webhook', webhookRepository);
    this._oauthServer = oauthServer;

    (async () => {
      await this._init();
    })();
  }

  async checkPermissionsForEntityByID(
    entityName: ProtectedEntityName,
    id: string | number,
  ): Promise<boolean> {
    return !!(await this.getEntityByID(entityName, id));
  }

  async getAllEntitiesForCurrentUser<TResult>(
    entityName: ProtectedEntityName,
  ): Promise<Array<TResult>> {
    // TODO - filter for current user
    // return nullthrows(this._repositoriesByEntityName.get(entityName)).find({
    //   where: { ownerID: currentUser.id },
    // }) as Promise<TResult[]>;

    return nullthrows(
      this._repositoriesByEntityName.get(entityName),
    ).find() as Promise<TResult[]>;
  }

  async getEntityByID<TResult extends Webhook | DeviceAttributes>(
    entityName: ProtectedEntityName,
    id: number | string,
  ): Promise<TResult> {
    const entity = (await nullthrows(
      this._repositoriesByEntityName.get(entityName),
    ).findOneByIDOrFail(id)) as unknown as TResult;

    if (!this.doesUserHaveAccess(entity)) {
      throw new HttpError("User doesn't have access", 403);
    }

    return entity;
  }

  async _createDefaultAdminUser() {
    try {
      await this._userRepository.createWithCredentials(
        {
          password: settings.DEFAULT_ADMIN_PASSWORD,
          username: settings.DEFAULT_ADMIN_USERNAME,
        },
        UserRole.Administrator,
      );

      const token = await this._generateAdminToken();

      logger.info({ token }, 'New default admin user created');
    } catch (error) {
      logger.error({ err: error }, 'Error during default admin user creating');
    }
  }

  doesUserHaveAccess(
    {
      ownerID,
    }: {
      ownerID: number | undefined | null;
    },
    currentUser: User = {
      id: 0,
      role: UserRole.Administrator,
      organizations: null,
      accessTokens: [],
      passwordHash: '',
      salt: '',
      userName: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ): boolean {
    return (
      currentUser.role === UserRole.Administrator || currentUser.id === ownerID
    );
  }

  async _generateAdminToken(): Promise<string> {
    const request = new Request({
      body: {
        client_id: 'spark-server',
        client_secret: 'spark-server',
        grant_type: 'password',
        password: settings.DEFAULT_ADMIN_PASSWORD,
        username: settings.DEFAULT_ADMIN_USERNAME,
      },
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'transfer-encoding': 'chunked',
      },
      method: 'POST',
      query: {},
    });

    const response = new Response({ body: {}, headers: {} });

    const tokenPayload = await this._oauthServer.server.token(
      request,
      response,
      // oauth server doesn't allow us to use infinite access token
      // so we pass some big value here
      { accessTokenLifetime: 9999999999 },
    );

    return tokenPayload.accessToken;
  }

  async _init() {
    let defaultAdminUser = await this._userRepository.getByUsername(
      settings.DEFAULT_ADMIN_USERNAME,
    );
    if (defaultAdminUser) {
      logger.info(
        { token: defaultAdminUser.accessTokens[0].accessToken },
        'Default Admin token',
      );
    } else {
      await this._createDefaultAdminUser();
      defaultAdminUser = await this._userRepository.getByUsernameOrFail(
        settings.DEFAULT_ADMIN_USERNAME,
      );
    }

    // Set up the organization
    const organizations = await this._organizationRepository.find();
    if (!organizations.length && defaultAdminUser) {
      await this._organizationRepository.create({
        name: 'DEFAULT ORG',
        users: [defaultAdminUser],
      });
    }
  }
}

export default PermissionManager;
