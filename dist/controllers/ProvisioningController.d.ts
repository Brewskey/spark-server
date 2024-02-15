import type DeviceManager from '../managers/DeviceManager';
import Controller from './Controller';
import { DeviceAPIType } from '../lib/deviceToAPI';
import { HttpResult } from './types';
declare class ProvisioningController extends Controller {
    _deviceManager: DeviceManager;
    constructor(deviceManager: DeviceManager);
    provision(deviceID: string, postBody: {
        algorithm: 'ecc' | 'rsa';
        filename: 'cli';
        order: string;
        publicKey: string;
    }): Promise<HttpResult<DeviceAPIType>>;
}
export default ProvisioningController;
