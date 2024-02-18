import type Controller from '../controllers/Controller';

export default <TController extends Controller>(route: string) =>
  (target: TController, name: keyof TController): void => {
    (target[name] as unknown as { route: string }).route = route;
  };
