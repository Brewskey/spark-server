export function filterFalsyValues<T>(value: T): value is NonNullable<T> {
  return value != null;
}
