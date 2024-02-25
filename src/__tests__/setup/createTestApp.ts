import { Container } from 'constitute';
import type { Application } from 'express';
import { DataSource } from 'typeorm';

import createApp from '../../app';
import getDefaultContainer from './getDefaultContainer';
import settings from './settings';

export type AppAndContainer = Application & {
  container: Container;
};

export const createTestApp = (dataSource: DataSource): AppAndContainer => {
  const container = getDefaultContainer(dataSource);
  const app = createApp(container, settings) as AppAndContainer;
  app.container = container;
  return app;
};
