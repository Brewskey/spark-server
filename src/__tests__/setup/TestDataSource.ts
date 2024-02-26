import { TYPEORM_ENTITIES } from '@brewskey/spark-protocol';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

export const getTestDataSource = () =>
  new DataSource({
    type: 'sqlite',
    database: ':memory:',
    entities: [TYPEORM_ENTITIES],
    synchronize: true,
    namingStrategy: new SnakeNamingStrategy(),
  });

// export default TestDataSource;
