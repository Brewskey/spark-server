import sinon from 'sinon';
import TestData from './setup/TestData';
import UserFileRepository from '../repository/UserFileRepository';

describe('UserFileRepository', () => {
  // Testing memoize
  test('should memoize and cache bust when mutator functions are called', async () => {
    const repository = new UserFileRepository('path');
    const user = await repository.createWithCredentials(TestData.getUser());
    const fileManager = repository._fileManager;
    const getAllSpy = sinon.spy(fileManager, 'getAllData');
    const getByIDSpy = sinon.spy(fileManager, 'getFile');
    const deleteByIDSpy = sinon.spy(fileManager, 'deleteFile');

    await repository.getAll();
    expect(getAllSpy.callCount).toBe(1);

    await repository.getByID(user.id);
    expect(getByIDSpy.callCount).toBe(1);

    await repository.updateByID(user.id, user);
    expect(getByIDSpy.callCount).toBe(2);

    await repository.deleteByID(user.id);
    expect(getByIDSpy.callCount).toBe(2);
    expect(deleteByIDSpy.callCount).toBe(1);
  });
});
