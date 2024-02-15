import type { IUserRepository, TokenObject, UserCredentials } from '../types';
import Controller from './Controller';
import { HttpResult } from './types';
declare class UsersController extends Controller {
    _userRepository: IUserRepository;
    constructor(userRepository: IUserRepository);
    createUser(userCredentials: UserCredentials): Promise<HttpResult<{
        ok: boolean;
    }>>;
    deleteAccessToken(token: string): Promise<HttpResult<{
        ok: boolean;
    }>>;
    getAccessTokens(): Promise<HttpResult<TokenObject[]>>;
}
export default UsersController;
