/* eslint-disable @typescript-eslint/no-explicit-any */
export const promisify = (
  object: any,
  fnName: string,
  ...args: Array<any>
): Promise<any> =>
  new Promise(
    (resolve: (result?: any) => void, reject: (error: Error) => void): void =>
      object[fnName](
        ...args,
        (error: Error, ...callbackArgs: any): any | null | undefined => {
          if (error) {
            reject(error);
            return null;
          }

          return callbackArgs.length <= 1
            ? resolve(...callbackArgs)
            : resolve(callbackArgs);
        },
      ),
  );
