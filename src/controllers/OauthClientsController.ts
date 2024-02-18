import Controller from './Controller';
import HttpError from '../lib/HttpError';
import httpVerb from '../decorators/httpVerb';
import route from '../decorators/route';

class OauthClientsController extends Controller {
  @httpVerb('post')
  @route('/v1/products/:productIDorSlug/clients/')
  async createClient(): Promise<void> {
    throw new HttpError('not supported in the current server version');
  }

  @httpVerb('put')
  @route('/v1/products/:productIDorSlug/clients/:clientID')
  async editClient(): Promise<void> {
    throw new HttpError('not supported in the current server version');
  }

  @httpVerb('delete')
  @route('/v1/products/:productIDorSlug/clients/:clientID')
  async deleteClient(): Promise<void> {
    throw new HttpError('not supported in the current server version');
  }
}

export default OauthClientsController;
