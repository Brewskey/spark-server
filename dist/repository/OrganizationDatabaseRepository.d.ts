import type { CollectionName } from './collectionNames';
import type { IBaseDatabase, IOrganizationRepository, Organization } from '../types';
import BaseRepository from './BaseRepository';
declare class OrganizationDatabaseRepository extends BaseRepository<Organization> implements IOrganizationRepository {
    _database: IBaseDatabase<Organization>;
    _collectionName: CollectionName;
    constructor(database: IBaseDatabase<Organization>);
    create: (model: Omit<Organization, 'id' | 'created_at'>) => Promise<Organization>;
    deleteByID: (id: string) => Promise<void>;
    getAll: (userID?: string | null | undefined) => Promise<Array<Organization>>;
    getByUserID: (userID: string) => Promise<Array<Organization>>;
    getByID: (id: string) => Promise<Organization | null | undefined>;
    updateByID: () => Promise<Organization>;
}
export default OrganizationDatabaseRepository;
