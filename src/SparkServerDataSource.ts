import { TYPEORM_ENTITIES } from '@brewskey/spark-protocol';
import dotenv from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import { getDatabaseConfigFromEnv } from './lib/getDatabaseConfigFromEnv';

dotenv.config();

const configFromEnv = getDatabaseConfigFromEnv(
  process.env,
) as unknown as DataSourceOptions;

const DEFAULT_SQLITE_DATASOURCE = {
  type: 'sqlite',
  database: 'data/particle.db',
  synchronize: true,
};

export const SparkServerDataSource = new DataSource({
  ...(configFromEnv ?? DEFAULT_SQLITE_DATASOURCE),
  entities: [TYPEORM_ENTITIES],
  namingStrategy: new SnakeNamingStrategy(),
});
