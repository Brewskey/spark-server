import nullthrows from 'nullthrows';
import { Request, Response } from 'oauth2-server';
import type {
  IOrganizationRepository,
  IUserRepository,
  IWebhookRepository,
  ProtectedEntityName,
} from '../types';
import HttpError from '../lib/HttpError';
import settings from '../settings';
import Logger from '../lib/logger';
import ExpressOAuthServer from 'express-oauth-server';
import {
  IBaseRepository,
  IDeviceAttributeRepository,
} from '@brewskey/spark-protocol';

const logger = Logger.createModuleLogger(module);

class PermissionManager {
  _organizationRepository: IOrganizationRepository;

  _userRepository: IUserRepository;

  _repositoriesByEntityName: Map<
    ProtectedEntityName,
    IBaseRepository<unknown>
  > = new Map();

  _oauthServer: ExpressOAuthServer;

  constructor(
    deviceAttributeRepository: IDeviceAttributeRepository,
    organizationRepository: IOrganizationRepository,
    userRepository: IUserRepository,
    webhookRepository: IWebhookRepository,
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

  checkPermissionsForEntityByID: (
    entityName: ProtectedEntityName,
    id: string,
  ) => Promise<boolean> = async (
    entityName: ProtectedEntityName,
    id: string,
  ): Promise<boolean> => !!(await this.getEntityByID(entityName, id));

  async getAllEntitiesForCurrentUser<TResult>(
    entityName: ProtectedEntityName,
  ): Promise<Array<TResult>> {
    const currentUser = this._userRepository.getCurrentUser();
    return nullthrows(this._repositoriesByEntityName.get(entityName)).getAll(
      currentUser.id,
    ) as Promise<TResult[]>;
  }

  async getEntityByID<TResult extends { ownerID: string | null | undefined }>(
    entityName: ProtectedEntityName,
    id: string,
  ): Promise<TResult> {
    const entity = (await nullthrows(
      this._repositoriesByEntityName.get(entityName),
    ).getByID(id)) as TResult;
    if (!entity) {
      throw new HttpError('Entity does not exist');
    }

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
        'administrator',
      );

      const token = await this._generateAdminToken();

      logger.info({ token }, 'New default admin user created');
    } catch (error) {
      logger.error({ err: error }, 'Error during default admin user creating');
    }
  }

  doesUserHaveAccess({
    ownerID,
  }: {
    ownerID: string | undefined | null;
  }): boolean {
    const currentUser = this._userRepository.getCurrentUser();
    return currentUser.role === 'administrator' || currentUser.id === ownerID;
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
      defaultAdminUser = await this._userRepository.getByUsername(
        settings.DEFAULT_ADMIN_USERNAME,
      );
    }

    // Set up the organization
    const organizations = await this._organizationRepository.getAll();
    if (!organizations.length && defaultAdminUser) {
      await this._organizationRepository.create({
        name: 'DEFAULT ORG',
        user_ids: [defaultAdminUser.id],
      });
    }
  }
}

export default PermissionManager;
