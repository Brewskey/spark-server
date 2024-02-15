declare class BaseMongoDb {
    __filterID: <TArgs extends {
        id?: string | number | undefined;
    }>({ id: _, ...otherProps }: TArgs) => Omit<TArgs, "id">;
    __translateQuery: (query: Record<string, unknown> | undefined) => Record<string, unknown>;
    __translateResultItem: <TEntity extends {
        id: string;
    }>(item?: TEntity | null | undefined) => TEntity | null;
}
export default BaseMongoDb;
