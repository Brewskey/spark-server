import {
  RepositoryBase,
  TokenObject,
  User,
  UserRole,
} from '@brewskey/spark-protocol';
import { Repository } from 'typeorm';

import HttpError from '../lib/HttpError';
import PasswordHasher from '../lib/PasswordHasher';
import type { UserCredentials } from '../types';

type MutateUserDTO = Omit<User, 'createdAt' | 'updatedAt' | 'organizations'>;
class UserRepository extends RepositoryBase<User, MutateUserDTO> {
  constructor(repository: Repository<User>) {
    super(User, repository);
  }

  createWithCredentials = async (
    userCredentials: UserCredentials,
    userRole: UserRole = UserRole.Default,
  ): Promise<User> => {
    const { username, password } = userCredentials;

    const salt = await PasswordHasher.generateSalt();
    const passwordHash = await PasswordHasher.hash(password, salt);
    const modelToSave = {
      accessTokens: [],
      passwordHash,
      role: userRole,
      salt,
      userName: username,
    };

    return this.create(modelToSave);
  };

  async deleteAccessToken(userID: number, accessToken: string): Promise<User> {
    const user = await this.findOneByIDOrFail(userID);
    user.accessTokens.filter((token) => token.accessToken === accessToken);
    return this.updateByID(user.id, user);
  }

  getByAccessToken(accessToken: string): Promise<User | null> {
    return this.repository
      .createQueryBuilder('user')
      .where('user.accessTokens like :accessToken', {
        accessToken: `%${accessToken}%`,
      })
      .getOne();
  }

  getByUsernameOrFail(userName: string): Promise<User> {
    return this.repository.findOneByOrFail({ userName });
  }

  getByUsername(userName: string): Promise<User | null> {
    return this.repository.findOneBy({ userName });
  }

  async isUserNameInUse(userName: string): Promise<boolean> {
    const user = await this.repository.findOneBy({ userName });
    return user != null;
  }

  async saveAccessToken(
    userID: number,
    tokenObject: TokenObject,
  ): Promise<User> {
    const user = await this.findOneByIDOrFail(userID);
    user.accessTokens.push(tokenObject);
    return this.repository.save(user);
  }

  async validateLogin(userName: string, password: string): Promise<User> {
    let user;
    try {
      user = await this.getByUsernameOrFail(userName);
    } catch (_) {
      throw new HttpError('Invalid credentials', 400);
    }

    const hash = await PasswordHasher.hash(password, user.salt);
    if (hash !== user.passwordHash) {
      throw new HttpError('Invalid credentials', 400);
    }

    return user;
  }
}

export default UserRepository;
