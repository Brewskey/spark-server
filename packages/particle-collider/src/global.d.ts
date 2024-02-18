declare module 'particle-api-js' {
  class Particle {
    constructor(params: {
      clientId: string;
      clientSecret: string;
      baseUrl: string;
    });

    login(params: {
      username: string;
      password: string;
    }): Promise<{ body: { access_token: string } }>;
    createUser(params: { username: string; password: string }): Promise<void>;
    sendPublicKey(params: {
      auth: string;
      deviceId: string;
      key: string;
    }): Promise<void>;
    listWebhooks(params: { auth: string }): Promise<{ body: { id: string }[] }>;
    createWebhook(params: Record<string, unknown>): Promise<void>;
    deleteWebhook(params: { auth: string; hookId: string }): Promise<void>;
    callFunction({
      auth: string,
      deviceId: string,
      name: string,
      argument: unknown,
    }): Promise<void>;
    getVariable({
      auth: string,
      deviceId: string,
      name: string,
    }): Promise<void>;
  }
  export = Particle;
}
