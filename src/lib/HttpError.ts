class HttpError extends Error {
  status: number;

  constructor(error: string | Error | HttpError, status: number = 400) {
    super(error instanceof Error ? error.message : error);
    if (error instanceof HttpError && typeof error.status === 'number') {
      this.status = error.status;
    } else {
      this.status = status;
    }
  }
}

export default HttpError;
