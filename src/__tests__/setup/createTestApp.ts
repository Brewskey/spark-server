import type { Application } from 'express';
import createApp from '../../app';
import settings from './settings';
import getDefaultContainer from './getDefaultContainer';
import { Container } from 'constitute';

type AppAndContainer = Application & {
  container: Container;
};

const container = getDefaultContainer();

const app = createApp(container, settings) as AppAndContainer;

export const createTestApp = (): AppAndContainer => {
  app.container = container;
  return app;
};
