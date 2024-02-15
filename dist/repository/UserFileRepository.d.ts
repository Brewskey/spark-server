import { JSONFileManager } from 'spark-protocol';
import type { IUserRepository, TokenObject, User, UserCredentials, UserRole } from '../types';
declare class UserFileRepository implements IUserRepository {
    _fileManager: JSONFileManager;
    _currentUser: User;
    constructor(path: string);
    count: () => Promise<number>;
    createWithCredentials: (userCredentials: UserCredentials, userRole?: UserRole | null | undefined) => Promise<User>;
    create(user: Omit<User, 'id' | 'created_at'>): Promise<User>;
    deleteAccessToken: (userID: string, token: string) => Promise<User>;
    deleteByID(id: string): Promise<void>;
    getAll(): Promise<Array<User>>;
    getByAccessToken: (accessToken: string) => Promise<User | null | undefined>;
    getByID(id: string): Promise<User | null | undefined>;
    getByUsername(username: string): Promise<User | null | undefined>;
    getCurrentUser: () => User;
    isUserNameInUse(username: string): Promise<boolean>;
    saveAccessToken: (userID: string, tokenObject: TokenObject) => Promise<User>;
    setCurrentUser: (arg1: User) => void;
    updateByID(id: string, props: Partial<User>): Promise<User>;
    validateLogin: (username: string, password: string) => Promise<User>;
}
export default UserFileRepository;
