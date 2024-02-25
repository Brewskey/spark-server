import {
  TYPEORM_ENTITIES,
  TYPEORM_MIGRATIONS,
  TYPEORM_SUBSCRIBERS,
} from '@brewskey/spark-protocol';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

export const getTestDataSource = () =>
  new DataSource({
    type: 'sqlite',
    database: ':memory:',
    entities: [TYPEORM_ENTITIES],
    migrationsRun: true,
    subscribers: [TYPEORM_SUBSCRIBERS],
    migrations: [TYPEORM_MIGRATIONS],
    namingStrategy: new SnakeNamingStrategy(),
  });

// export default TestDataSource;
