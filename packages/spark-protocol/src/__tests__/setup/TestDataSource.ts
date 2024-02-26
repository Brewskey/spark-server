import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { TYPEORM_ENTITIES } from '../..';

export const TestDataSource = new DataSource({
  type: 'sqlite',
  database: ':memory:',
  entities: [TYPEORM_ENTITIES],
  synchronize: true,
  namingStrategy: new SnakeNamingStrategy(),
});

// export default TestDataSource;
