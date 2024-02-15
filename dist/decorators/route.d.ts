import type Controller from '../controllers/Controller';
declare const _default: <TController extends Controller>(route: string) => (target: TController, name: keyof TController) => void;
export default _default;
