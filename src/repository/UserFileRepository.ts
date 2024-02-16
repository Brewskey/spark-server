import * as uuid from 'uuid';
import { JSONFileManager } from '@brewskey/spark-protocol';
import type {
  IUserRepository,
  TokenObject,
  User,
  UserCredentials,
  UserRole,
} from '../types';
import PasswordHasher from '../lib/PasswordHasher';
import HttpError from '../lib/HttpError';
import nullthrows from 'nullthrows';

class UserFileRepository implements IUserRepository {
  _fileManager: JSONFileManager;

  _currentUser!: User;

  constructor(path: string) {
    this._fileManager = new JSONFileManager(path);
  }

  count: () => Promise<number> = async (): Promise<number> =>
    this._fileManager.count();

  createWithCredentials: (
    userCredentials: UserCredentials,
    userRole?: UserRole | null | undefined,
  ) => Promise<User> = async (
    userCredentials: UserCredentials,
    userRole: UserRole | null = null,
  ): Promise<User> => {
    const { username, password } = userCredentials;

    const salt = await PasswordHasher.generateSalt();
    const passwordHash = await PasswordHasher.hash(password, salt);
    const modelToSave = {
      accessTokens: [],
      passwordHash,
      role: userRole,
      salt,
      username,
    };

    return this.create(modelToSave);
  };

  async create(user: Omit<User, 'id' | 'created_at'>): Promise<User> {
    let id = uuid.v4();
    // eslint-disable-next-line no-await-in-loop
    while (await this._fileManager.hasFile(`${id}.json`)) {
      id = uuid.v4();
    }

    const modelToSave = {
      ...user,
      created_at: new Date(),
      created_by: null,
      id,
    };

    this._fileManager.createFile(`${modelToSave.id}.json`, modelToSave);
    return modelToSave;
  }

  deleteAccessToken: (userID: string, token: string) => Promise<User> = async (
    userID: string,
    token: string,
  ): Promise<User> => {
    const user = await this.getByID(userID);
    if (!user) {
      throw new Error("User doesn't exist");
    }

    return this.updateByID(userID, {
      accessTokens: user.accessTokens.filter(
        (tokenObject: TokenObject): boolean =>
          tokenObject.accessToken !== token,
      ),
    });
  };

  async deleteByID(id: string) {
    this._fileManager.deleteFile(`${id}.json`);
  }

  async getAll(): Promise<Array<User>> {
    return this._fileManager.getAllData();
  }

  // This isn't a good one to memoize as we can't key off user ID and there
  // isn't a good way to clear the cache.
  getByAccessToken: (accessToken: string) => Promise<User | null | undefined> =
    async (accessToken: string): Promise<User | null | undefined> =>
      (await this.getAll()).find((user: User): boolean =>
        user.accessTokens.some(
          (tokenObject: TokenObject): boolean =>
            tokenObject.accessToken === accessToken,
        ),
      );

  async getByID(id: string): Promise<User | null | undefined> {
    return this._fileManager.getFile(`${id}.json`);
  }

  async getByUsername(username: string): Promise<User | null | undefined> {
    return (await this.getAll()).find(
      (user: User): boolean => user.username === username,
    );
  }

  getCurrentUser: () => User = (): User => this._currentUser;

  async isUserNameInUse(username: string): Promise<boolean> {
    return (await this.getAll()).some(
      (user: User): boolean => user.username === username,
    );
  }

  saveAccessToken: (userID: string, tokenObject: TokenObject) => Promise<User> =
    async (userID: string, tokenObject: TokenObject): Promise<User> => {
      const user = await this.getByID(userID);

      if (!user) {
        throw new HttpError('Could not find user for user ID');
      }

      return this.updateByID(userID, {
        accessTokens: [...user.accessTokens, tokenObject],
      });
    };

  setCurrentUser: (arg1: User) => void = (user: User) => {
    this._currentUser = user;
  };

  async updateByID(id: string, props: Partial<User>): Promise<User> {
    const user = nullthrows(await this.getByID(id));
    const modelToSave = { ...user, ...props } as const;

    this._fileManager.writeFile(`${id}.json`, modelToSave);
    return modelToSave;
  }

  validateLogin: (username: string, password: string) => Promise<User> = async (
    username: string,
    password: string,
  ): Promise<User> => {
    const user = await this.getByUsername(username);

    if (!user) {
      throw new Error("User doesn't exist");
    }

    const hash = await PasswordHasher.hash(password, user.salt);
    if (hash !== user.passwordHash) {
      throw new Error('Wrong password');
    }

    return user;
  };
}

export default UserFileRepository;
