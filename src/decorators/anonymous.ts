import type Controller from '../controllers/Controller';

export default () =>
  <TController extends Controller>(
    target: TController,
    name: keyof TController,
  ) => {
    (target[name] as { anonymous: boolean }).anonymous = true;
  };
