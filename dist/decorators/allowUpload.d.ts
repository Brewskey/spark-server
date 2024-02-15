import type Controller from '../controllers/Controller';
declare const _default: (fileName?: string | null, maxCount?: number) => <TController extends Controller>(target: TController, name: keyof TController) => void;
export default _default;
