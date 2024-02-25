import { User } from '@brewskey/spark-protocol';
import { EntityNotFoundError } from 'typeorm';

import UserRepository from '../repository/UserRepository';
import TestData from './setup/TestData';
import { getTestDataSource } from './setup/TestDataSource';

describe('UserRepository', () => {
  // Testing memoize
  test('should successfully call repository functions', async () => {
    const dataSource = getTestDataSource();
    await dataSource.initialize();
    const repository = new UserRepository(dataSource.getRepository(User));
    let user = await repository.createWithCredentials(TestData.getUser());

    expect(await repository.find()).toMatchObject([user]);

    expect(await repository.findOneByIDOrFail(user.id)).toMatchObject(user);

    user = await repository.updateByID(user.id, user);
    expect(await repository.findOneByIDOrFail(user.id)).toMatchObject(user);

    await repository.deleteByID(user.id);
    await expect(repository.findOneByIDOrFail(user.id)).rejects.toThrow(
      new EntityNotFoundError(User, { id: 1 }),
    );
    await dataSource.destroy();
  });
});
