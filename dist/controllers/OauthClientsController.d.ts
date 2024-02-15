import Controller from './Controller';
declare class OauthClientsController extends Controller {
    createClient(): Promise<void>;
    editClient(): Promise<void>;
    deleteClient(): Promise<void>;
}
export default OauthClientsController;
