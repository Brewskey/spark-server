import getDefaultContainer from './setup/getDefaultContainer';
import { getTestDataSource } from './setup/TestDataSource';

describe('defaultBindings', () => {
  const dataSource = getTestDataSource();
  const container = getDefaultContainer(dataSource);

  const ITEM_KEYS = Array.from(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (container as any)._factories.keys(),
  ) as string[];

  beforeAll(async () => {
    await dataSource.initialize();
    // Wait for PermissionManager to create admin user
    container.constitute('PermissionManager');
    await new Promise((resolve: (_: void) => void) => {
      setTimeout(resolve, 1000);
    });
  });

  it.each(ITEM_KEYS)('should constitue %s', (key) => {
    container.constitute(key);
  });
});
