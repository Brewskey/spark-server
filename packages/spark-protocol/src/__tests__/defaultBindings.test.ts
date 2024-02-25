import { Container } from 'constitute';

import defaultBindings from '../defaultBindings';
import DeviceServer from '../server/DeviceServer';
import settings from '../settings';
import { TestDataSource } from './setup/TestDataSource';

describe('defaultBindings', () => {
  const container = new Container();
  container.bindValue('DataSource', TestDataSource);
  defaultBindings(container, settings);

  const ITEM_KEYS = Array.from(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (container as any)._factories.keys(),
  ) as string[];

  beforeAll(async () => {
    await TestDataSource.initialize();
  });

  it.each(ITEM_KEYS)('should constitue %s', (key) => {
    container.constitute(key);
  });

  afterAll(async () => {
    const deviceServer = container.constitute<DeviceServer>('DeviceServer');
    deviceServer.onShutdown();
    await TestDataSource.destroy();
  });
});
