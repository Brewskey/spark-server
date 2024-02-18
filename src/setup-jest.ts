import { createTestApp } from './__tests__/setup/createTestApp';

afterEach(() => {
  const app = createTestApp();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const keys = Array.from((app.container as any)._factories.keys()) as string[];
  keys.forEach((key: string) => {
    const instance = app.container.constitute(key) as {
      onShutdown?: () => void;
    };

    if (instance?.onShutdown) {
      instance.onShutdown();
    }
  });
});
