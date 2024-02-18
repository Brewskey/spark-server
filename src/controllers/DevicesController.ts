import nullthrows from 'nullthrows';
import type DeviceManager from '../managers/DeviceManager';
import type { DeviceAPIType } from '../lib/deviceToAPI';
import Controller from './Controller';
import HttpError from '../lib/HttpError';
import FirmwareCompilationManager, {
  CompilationResponse,
} from '../managers/FirmwareCompilationManager';
import allowUpload from '../decorators/allowUpload';
import httpVerb from '../decorators/httpVerb';
import route from '../decorators/route';
import deviceToAPI from '../lib/deviceToAPI';
import Logger from '../lib/logger';
import { HttpResult } from './types';
const logger = Logger.createModuleLogger(module);

type CompileConfig = {
  platform_id?: string;
  product_id?: string;
};

class DevicesController extends Controller {
  _deviceManager: DeviceManager;

  constructor(deviceManager: DeviceManager) {
    super();

    this._deviceManager = deviceManager;
  }

  @httpVerb('post')
  @route('/v1/devices')
  async claimDevice(postBody: {
    id: string;
  }): Promise<HttpResult<{ ok: boolean }>> {
    let deviceID = postBody.id;
    try {
      deviceID = await this._deviceManager.getDeviceID(deviceID);
    } catch (_) {
      // We want to ignore the error and let the `claimDevice` call throw the exception
    }

    await this._deviceManager.claimDevice(deviceID, this.user.id);

    return this.ok({ ok: true });
  }

  @httpVerb('get')
  @route('/v1/binaries/:binaryID')
  async getAppFirmware(
    binaryID: string,
  ): Promise<HttpResult<Buffer | null | undefined>> {
    return this.ok(FirmwareCompilationManager.getBinaryForID(binaryID));
  }

  @httpVerb('post')
  @route('/v1/binaries')
  @allowUpload()
  async compileSources(
    postBody: CompileConfig,
  ): Promise<HttpResult<CompilationResponse>> {
    const files = this.request.files;

    if (!files) {
      return this.bad('No files were uploaded');
    }

    const response = await FirmwareCompilationManager.compileSource(
      nullthrows(postBody.platform_id || postBody.product_id),
      Array.isArray(files) ? files : Object.values(files).flat(),
    );

    if (!response) {
      throw new HttpError('Error during compilation');
    }

    return this.ok({
      ...response,
      binary_url: `/v1/binaries/${response.binary_id}`,
      ok: true,
    });
  }

  @httpVerb('delete')
  @route('/v1/devices/:deviceIDorName')
  async unclaimDevice(
    deviceIDorName: string,
  ): Promise<HttpResult<{ ok: boolean }>> {
    const deviceID = await this._deviceManager.getDeviceID(deviceIDorName);
    await this._deviceManager.unclaimDevice(deviceID);
    return this.ok({ ok: true });
  }

  @httpVerb('get')
  @route('/v1/devices')
  async getDevices(): Promise<HttpResult<DeviceAPIType[]>> {
    try {
      const devices = await this._deviceManager.getAll();
      return this.ok(
        devices.map((device): DeviceAPIType => deviceToAPI(device)),
      );
    } catch (error) {
      // I wish we could return no devices found but meh :/
      // at least we should issue a warning
      logger.warn(
        { err: error },
        'get devices throws error, possibly no devices found?',
      );
      return this.ok([]);
    }
  }

  @httpVerb('get')
  @route('/v1/devices/:deviceIDorName')
  async getDevice(deviceIDorName: string): Promise<HttpResult<DeviceAPIType>> {
    const deviceID = await this._deviceManager.getDeviceID(deviceIDorName);
    const device = await this._deviceManager.getByID(deviceID);
    return this.ok(deviceToAPI(device));
  }

  @httpVerb('get')
  @route('/v1/devices/:deviceIDorName/:varName/')
  async getVariableValue(
    deviceIDorName: string,
    varName: string,
  ): Promise<HttpResult<{ result: unknown }>> {
    try {
      const deviceID = await this._deviceManager.getDeviceID(deviceIDorName);
      const varValue = await this._deviceManager.getVariableValue(
        deviceID,
        varName,
      );

      return this.ok({ result: varValue });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : JSON.stringify(error);
      if (errorMessage.match('Variable not found')) {
        throw new HttpError('Variable not found', 404);
      }
      throw error;
    }
  }

  @httpVerb('put')
  @route('/v1/devices/:deviceIDorName')
  @allowUpload('file', 1)
  async updateDevice(
    deviceIDorName: string,
    postBody: {
      app_id?: string;
      file?: Express.Multer.File;
      file_type?: 'binary';
      name?: string;
      signal?: '1' | '0';
    },
  ): Promise<
    HttpResult<
      | { name: string; ok: true }
      | { id: string; ok: true }
      | { id: string; status: number }
    >
  > {
    const deviceID = await this._deviceManager.getDeviceID(deviceIDorName);
    // 1 rename device
    if (postBody.name) {
      const updatedAttributes = await this._deviceManager.renameDevice(
        deviceID,
        postBody.name,
      );
      return this.ok({ name: updatedAttributes.name, ok: true });
    }

    // 2
    // If signal exists then we want to toggle nyan mode. This just makes the
    // LED change colors.
    if (postBody.signal) {
      if (!['1', '0'].includes(postBody.signal)) {
        throw new HttpError('Wrong signal value');
      }

      await this._deviceManager.raiseYourHand(
        deviceID,
        !!parseInt(postBody.signal, 10),
      );

      return this.ok({ id: deviceID, ok: true });
    }

    // 3 flash device with known application
    if (postBody.app_id) {
      const flashResult = await this._deviceManager.flashKnownApp(
        deviceID,
        postBody.app_id,
      );

      return this.ok({ id: deviceID, status: flashResult.status });
    }

    // 4 flash device with custom application
    const { file } = postBody;
    if (!file) {
      throw new Error('Firmware file not provided');
    }

    const { originalname } = file;
    if (originalname === 'binary' || originalname.endsWith('.bin')) {
      const flashResult = await this._deviceManager.flashBinary(deviceID, file);

      return this.ok({ id: deviceID, status: flashResult.status });
    }

    throw new HttpError('Did not update device');
  }

  @httpVerb('post')
  @route('/v1/devices/:deviceIDorName/:functionName')
  async callDeviceFunction(
    deviceIDorName: string,
    functionName: string,
    postBody: Record<string, string>,
  ): Promise<HttpResult<DeviceAPIType>> {
    try {
      const deviceID = await this._deviceManager.getDeviceID(deviceIDorName);
      const result = await this._deviceManager.callFunction(
        deviceID,
        functionName,
        postBody,
      );
      const device = await this._deviceManager.getByID(deviceID);

      return this.ok(deviceToAPI(device, result));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : JSON.stringify(error);
      if (errorMessage.indexOf('Unknown Function') >= 0) {
        throw new HttpError('Function not found', 404);
      }
      throw error;
    }
  }

  @httpVerb('put')
  @route('/v1/devices/:deviceIDorName/ping')
  async pingDevice(deviceIDorName: string): Promise<
    HttpResult<{
      error?: Error | undefined;
    }>
  > {
    const deviceID = await this._deviceManager.getDeviceID(deviceIDorName);
    return this.ok(await this._deviceManager.ping(deviceID));
  }
}

export default DevicesController;
