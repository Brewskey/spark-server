import type { ClaimCodeManager } from '@brewskey/spark-protocol';
import nullthrows from 'nullthrows';
import type DeviceManager from '../managers/DeviceManager';
import Controller from './Controller';
import httpVerb from '../decorators/httpVerb';
import route from '../decorators/route';
import { HttpResult } from './types';

class DeviceClaimsController extends Controller {
  _deviceManager: DeviceManager;

  _claimCodeManager: ClaimCodeManager;

  constructor(
    deviceManager: DeviceManager,
    claimCodeManager: ClaimCodeManager,
  ) {
    super();

    this._deviceManager = deviceManager;
    this._claimCodeManager = claimCodeManager;
  }

  @httpVerb('post')
  @route('/v1/device_claims')
  async createClaimCode(): Promise<
    HttpResult<{ claim_code: string; device_ids: string[] }>
  > {
    const claimCode = this._claimCodeManager.createClaimCode(this.user.id);

    const devices = await this._deviceManager.getAll();
    const deviceIDs = devices.map((device): string =>
      nullthrows(device.deviceID),
    );
    return this.ok({ claim_code: claimCode, device_ids: deviceIDs });
  }
}

export default DeviceClaimsController;
