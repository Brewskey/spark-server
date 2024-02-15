import type { IOrganizationRepository, IUserRepository, IWebhookRepository, ProtectedEntityName } from '../types';
import ExpressOAuthServer from 'express-oauth-server';
import { IBaseRepository, IDeviceAttributeRepository } from 'spark-protocol';
declare class PermissionManager {
    _organizationRepository: IOrganizationRepository;
    _userRepository: IUserRepository;
    _repositoriesByEntityName: Map<ProtectedEntityName, IBaseRepository<unknown>>;
    _oauthServer: ExpressOAuthServer;
    constructor(deviceAttributeRepository: IDeviceAttributeRepository, organizationRepository: IOrganizationRepository, userRepository: IUserRepository, webhookRepository: IWebhookRepository, oauthServer: ExpressOAuthServer);
    checkPermissionsForEntityByID: (entityName: ProtectedEntityName, id: string) => Promise<boolean>;
    getAllEntitiesForCurrentUser<TResult>(entityName: ProtectedEntityName): Promise<Array<TResult>>;
    getEntityByID<TResult extends {
        ownerID: string | null | undefined;
    }>(entityName: ProtectedEntityName, id: string): Promise<TResult>;
    _createDefaultAdminUser(): Promise<void>;
    doesUserHaveAccess({ ownerID, }: {
        ownerID: string | undefined | null;
    }): boolean;
    _generateAdminToken(): Promise<string>;
    _init(): Promise<void>;
}
export default PermissionManager;
