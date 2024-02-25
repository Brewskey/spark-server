import path from 'path';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

export const TestDataSource = new DataSource({
  type: 'sqlite',
  database: path.join(__dirname, 'particle.db'),
  entities: [path.join(__dirname, '../..', '/entity/*.entity{.ts,.js}')],
  migrationsRun: true,
  subscribers: [
    path.join(__dirname, '../..', '/subscriber/*.subscriber{.ts,.js}'),
  ],
  migrations: [path.join(__dirname, '../..', '/migration/*{.ts,.js}')],
  namingStrategy: new SnakeNamingStrategy(),
});

// export default TestDataSource;
