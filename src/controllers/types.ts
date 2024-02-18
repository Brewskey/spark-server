export type HttpResult<TType> =
  | {
      data: TType | null | undefined;
      status: number;
    }
  | {
      data: {
        error: string;
        ok: false;
      };
      status: number;
    };
