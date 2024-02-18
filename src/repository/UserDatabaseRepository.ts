import type { CollectionName } from './collectionNames';
import type {
  IBaseDatabase,
  IUserRepository,
  TokenObject,
  User,
  UserCredentials,
  UserRole,
} from '../types';

import BaseRepository from './BaseRepository';
import COLLECTION_NAMES from './collectionNames';
import PasswordHasher from '../lib/PasswordHasher';
import HttpError from '../lib/HttpError';

class UserDatabaseRepository
  extends BaseRepository<User>
  implements IUserRepository
{
  _database: IBaseDatabase<User>;

  _collectionName: CollectionName = COLLECTION_NAMES.USERS;

  _currentUser!: User;

  constructor(database: IBaseDatabase<User>) {
    super(database, COLLECTION_NAMES.USERS);
    this._database = database;

    this.tryCreateIndex({ accessTokens: 1 });
    this.tryCreateIndex({ 'accessTokens.accessToken': 1 });
    this.tryCreateIndex({ username: 1 });
  }

  // eslint-disable-next-line no-unused-vars
  create = async (user: Omit<User, 'id' | 'created_at'>): Promise<User> =>
    this._database.insertOne(this._collectionName, user);

  createWithCredentials = async (
    userCredentials: UserCredentials,
    userRole: UserRole | null = null,
  ): Promise<User> => {
    const { username, password } = userCredentials;

    const salt = await PasswordHasher.generateSalt();
    const passwordHash = await PasswordHasher.hash(password, salt);
    const modelToSave = {
      accessTokens: [],
      created_at: new Date(),
      passwordHash,
      role: userRole,
      salt,
      username,
    };

    return this._database.insertOne(this._collectionName, modelToSave);
  };

  deleteAccessToken: (userID: string, accessToken: string) => Promise<User> =
    async (userID: string, accessToken: string): Promise<User> =>
      this._database.findAndModify(
        this._collectionName,
        { _id: userID },
        { $pull: { accessTokens: { accessToken } } },
      );

  deleteByID: (id: string) => Promise<void> = async (
    id: string,
  ): Promise<void> => this._database.remove(this._collectionName, { _id: id });

  getAll: () => Promise<Array<User>> = async (): Promise<Array<User>> => {
    throw new Error('The method is not implemented');
  };

  getByAccessToken: (accessToken: string) => Promise<User | null | undefined> =
    async (accessToken: string): Promise<User | null | undefined> => {
      let user = await this._database.findOne(this._collectionName, {
        accessTokens: { $elemMatch: { accessToken } },
      });

      if (!user) {
        // The newer query only works on mongo so we run this for tingo.
        user = await this._database.findOne(this._collectionName, {
          'accessTokens.accessToken': accessToken,
        });
      }

      return user;
    };

  // eslint-disable-next-line no-unused-vars
  getByID: (id: string) => Promise<User | null | undefined> = async (): Promise<
    User | null | undefined
  > => {
    throw new Error('The method is not implemented');
  };

  getByUsername: (username: string) => Promise<User | null | undefined> =
    async (username: string): Promise<User | null | undefined> =>
      this._database.findOne(this._collectionName, { username });

  getCurrentUser: () => User = (): User => this._currentUser;

  isUserNameInUse: (username: string) => Promise<boolean> = async (
    username: string,
  ): Promise<boolean> => !!(await this.getByUsername(username));

  saveAccessToken: (userID: string, tokenObject: TokenObject) => Promise<User> =
    async (userID: string, tokenObject: TokenObject): Promise<User> =>
      this._database.findAndModify(
        this._collectionName,
        { _id: userID },
        { $push: { accessTokens: tokenObject } },
      );

  setCurrentUser: (arg1: User) => void = (user: User) => {
    this._currentUser = user;
  };

  updateByID: (id: string, props: Partial<User>) => Promise<User> = async (
    id: string,
    props: Partial<User>,
  ): Promise<User> =>
    this._database.findAndModify(
      this._collectionName,
      { _id: id },
      { $set: { ...props } },
    );

  validateLogin: (username: string, password: string) => Promise<User> = async (
    username: string,
    password: string,
  ): Promise<User> => {
    const user = await this._database.findOne(this._collectionName, {
      username,
    });

    if (!user) {
      throw new HttpError("User doesn't exist", 404);
    }

    const hash = await PasswordHasher.hash(password, user.salt);
    if (hash !== user.passwordHash) {
      throw new HttpError('Wrong password');
    }

    return user;
  };
}

export default UserDatabaseRepository;
