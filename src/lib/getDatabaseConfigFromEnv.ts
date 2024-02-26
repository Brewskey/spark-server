import { deepmerge } from 'deepmerge-ts';

const getCamelCase = (value: string) =>
  value.toLowerCase().replace(/(_\w)/g, (k) => k[1].toUpperCase());

export const getDatabaseConfigFromEnv = (
  data: Record<string, string | undefined>,
): Record<string, unknown> | null => {
  const databaseKeys = Object.keys(data).filter((key) =>
    key.startsWith('DATABASE__'),
  );

  if (!databaseKeys.length) {
    return null;
  }

  return databaseKeys.reduce(
    (acc: Record<string, unknown>, key: string): Record<string, unknown> => {
      const splitAndConvertedKeys = key.split('__').map(getCamelCase);

      splitAndConvertedKeys.reverse();
      splitAndConvertedKeys.pop();

      return deepmerge(
        acc,
        splitAndConvertedKeys.reduce(
          (
            keyAccumulator: string | Record<string, unknown>,
            splitKey: string,
          ): Record<string, unknown> => {
            return {
              [splitKey]: keyAccumulator,
            };
          },
          data[key] as unknown as Record<string, unknown>,
        ),
      );
    },
    {} as Record<string, unknown>,
  );
};
