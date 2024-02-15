import type { HttpVerb } from './types';
import type Controller from '../controllers/Controller';

export default <TController extends Controller>(httpVerb: HttpVerb) =>
  (target: TController, name: keyof TController): void => {
    (target[name] as unknown as { httpVerb: HttpVerb }).httpVerb = httpVerb;
  };
