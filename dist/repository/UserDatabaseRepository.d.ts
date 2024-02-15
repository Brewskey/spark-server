import type { CollectionName } from './collectionNames';
import type { IBaseDatabase, IUserRepository, TokenObject, User, UserCredentials, UserRole } from '../types';
import BaseRepository from './BaseRepository';
declare class UserDatabaseRepository extends BaseRepository<User> implements IUserRepository {
    _database: IBaseDatabase<User>;
    _collectionName: CollectionName;
    _currentUser: User;
    constructor(database: IBaseDatabase<User>);
    create: (user: Omit<User, 'id' | 'created_at'>) => Promise<User>;
    createWithCredentials: (userCredentials: UserCredentials, userRole?: UserRole | null) => Promise<User>;
    deleteAccessToken: (userID: string, accessToken: string) => Promise<User>;
    deleteByID: (id: string) => Promise<void>;
    getAll: () => Promise<Array<User>>;
    getByAccessToken: (accessToken: string) => Promise<User | null | undefined>;
    getByID: (id: string) => Promise<User | null | undefined>;
    getByUsername: (username: string) => Promise<User | null | undefined>;
    getCurrentUser: () => User;
    isUserNameInUse: (username: string) => Promise<boolean>;
    saveAccessToken: (userID: string, tokenObject: TokenObject) => Promise<User>;
    setCurrentUser: (arg1: User) => void;
    updateByID: (id: string, props: Partial<User>) => Promise<User>;
    validateLogin: (username: string, password: string) => Promise<User>;
}
export default UserDatabaseRepository;
