import { MongoClient } from 'mongodb';

import MongoDb from '../repository/MongoDb';

/**
 * Integration test against a real mongo — the suite otherwise runs on NeDb,
 * which is how the findAndModify pre-image bug (upsert-inserts returned the
 * null PRE-image and threw "Got unexpected null"; updates returned stale
 * documents) shipped without a failing test. Provide MONGO_TEST_URL to run,
 * e.g.:
 *
 *   MONGO_TEST_URL=mongodb://localhost:27017 npx jest MongoDb
 */
const mongoUrl = process.env.MONGO_TEST_URL;
const describeWithMongo = mongoUrl ? describe : describe.skip;

type TestEntity = {
  id: string;
  created_at: number;
  deviceID?: string;
  name?: string;
};

describeWithMongo('MongoDb', () => {
  const databaseName = `spark-server-test-${process.pid}-${Date.now()}`;
  const databaseUrl = `${mongoUrl}/${databaseName}`;
  let database: MongoDb<TestEntity>;

  beforeAll(() => {
    database = new MongoDb<TestEntity>(databaseUrl);
  });

  afterAll(async () => {
    const cleanupClient = await MongoClient.connect(databaseUrl);
    await cleanupClient.db().dropDatabase();
    await cleanupClient.close();
    await database.disconnect();
  });

  test('findAndModify returns the inserted document when the upsert inserts', async () => {
    const result = await database.findAndModify(
      'deviceAttributes',
      { deviceID: 'aabbccddeeff001122334455' },
      { $set: { deviceID: 'aabbccddeeff001122334455', name: 'first' } },
    );

    expect(result).not.toBeNull();
    expect(result.deviceID).toBe('aabbccddeeff001122334455');
    expect(result.name).toBe('first');
  });

  test('findAndModify returns the UPDATED document, not the pre-image', async () => {
    await database.findAndModify(
      'deviceAttributes',
      { deviceID: 'renamed-device' },
      { $set: { deviceID: 'renamed-device', name: 'before' } },
    );

    const result = await database.findAndModify(
      'deviceAttributes',
      { deviceID: 'renamed-device' },
      { $set: { name: 'after' } },
    );

    expect(result.name).toBe('after');
  });
});
