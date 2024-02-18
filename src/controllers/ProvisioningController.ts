import type DeviceManager from '../managers/DeviceManager';

import Controller from './Controller';
import httpVerb from '../decorators/httpVerb';
import route from '../decorators/route';
import deviceToAPI, { DeviceAPIType } from '../lib/deviceToAPI';
import HttpError from '../lib/HttpError';
import { HttpResult } from './types';

class ProvisioningController extends Controller {
  _deviceManager: DeviceManager;

  constructor(deviceManager: DeviceManager) {
    super();

    this._deviceManager = deviceManager;
  }

  @httpVerb('post')
  @route('/v1/provisioning/:deviceID')
  async provision(
    deviceID: string,
    postBody: {
      algorithm: 'ecc' | 'rsa';
      filename: 'cli';
      order: string; // not sure what this is used for,
      publicKey: string;
    },
  ): Promise<HttpResult<DeviceAPIType>> {
    if (!postBody.publicKey) {
      throw new HttpError('No key provided');
    }

    const device = await this._deviceManager.provision(
      deviceID,
      this.user.id,
      postBody.publicKey,
      postBody.algorithm,
    );

    if (!device) {
      throw new HttpError('Provisioning error');
    }

    return this.ok(deviceToAPI(device));
  }
}

export default ProvisioningController;
