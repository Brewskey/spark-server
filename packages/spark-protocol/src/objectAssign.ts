export const objectAssign = <TObject extends object>(
  s: TObject,
  t: Partial<TObject>,
): TObject => Object.assign(s, t);
