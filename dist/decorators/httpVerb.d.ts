import type { HttpVerb } from './types';
import type Controller from '../controllers/Controller';
declare const _default: <TController extends Controller>(httpVerb: HttpVerb) => (target: TController, name: keyof TController) => void;
export default _default;
