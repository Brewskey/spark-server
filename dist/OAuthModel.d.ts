import type { Client, IUserRepository, TokenObject, User } from './types';
type AccessToken = (TokenObject & {
    user: User;
}) | null;
declare class OauthModel {
    _userRepository: IUserRepository;
    constructor(userRepository: IUserRepository);
    getAccessToken: (arg1: string) => Promise<AccessToken | null | undefined>;
    getClient: (clientId: string, clientSecret: string) => Client | undefined;
    getUser: (username: string, password: string) => Promise<User>;
    saveToken: (tokenObject: TokenObject, client: Client, user: User) => {
        accessToken: string;
        client: Client;
        user: User;
    };
    validateScope: (user: User, client: Client, scope: string) => string;
}
export default OauthModel;
