import type Controller from '../controllers/Controller';

type AllowedUploads = { allowedUploads: { maxCount: number; name: string }[] };

/* eslint-disable no-param-reassign */
export default (fileName: string | null = null, maxCount: number = 0) =>
  <TController extends Controller>(
    target: TController,
    name: keyof TController,
  ) => {
    const allowedUploads =
      (target[name] as AllowedUploads).allowedUploads || [];
    if (fileName) {
      allowedUploads.push({
        maxCount,
        name: fileName,
      });
    }

    (target[name] as AllowedUploads).allowedUploads = allowedUploads;
  };
