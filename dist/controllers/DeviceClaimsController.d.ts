import type { ClaimCodeManager } from 'spark-protocol';
import type DeviceManager from '../managers/DeviceManager';
import Controller from './Controller';
import { HttpResult } from './types';
declare class DeviceClaimsController extends Controller {
    _deviceManager: DeviceManager;
    _claimCodeManager: ClaimCodeManager;
    constructor(deviceManager: DeviceManager, claimCodeManager: ClaimCodeManager);
    createClaimCode(): Promise<HttpResult<{
        claim_code: string;
        device_ids: string[];
    }>>;
}
export default DeviceClaimsController;
