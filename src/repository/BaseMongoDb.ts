import { ObjectId } from 'mongodb';

const deepToObjectIdCast = (
  node: Record<string, unknown>,
): Record<string, unknown> => {
  Object.keys(node).forEach((key: string) => {
    const val = node[key];
    if (val === Object(node[key])) {
      deepToObjectIdCast(val as Record<string, unknown>);
    }
    if (key === '_id') {
      // eslint-disable-next-line
      node[key] = new ObjectId(val as number);
    }
  });
  return node;
};

class BaseMongoDb {
  // eslint-disable-next-line no-unused-vars
  __filterID = <TArgs extends { id?: string | number }>({
    id: _,
    ...otherProps
  }: TArgs): Omit<TArgs, 'id'> => ({
    ...otherProps,
  });

  __translateQuery = (
    query: Record<string, unknown> | undefined,
  ): Record<string, unknown> =>
    this.__filterID(deepToObjectIdCast(query ?? {}));

  __translateResultItem = <TEntity extends { id: string }>(
    item?: TEntity | null,
  ): TEntity | null => {
    if (!item) {
      return null;
    }

    const castEntity = item as unknown as { _id?: string; id: string };
    if (castEntity._id) {
      castEntity.id = castEntity._id.toString();
      delete castEntity._id;
    }

    return item;
  };
}

export default BaseMongoDb;
