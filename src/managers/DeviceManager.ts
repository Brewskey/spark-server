import type {
  DeviceAttributeRepository,
  DeviceAttributes,
  DeviceKeyAlgorithm,
  DeviceKeyObjectRepository,
  EventPublisher,
} from '@brewskey/spark-protocol';
import { NAME_GENERATOR, SPARK_SERVER_EVENTS } from '@brewskey/spark-protocol';
import ECKey from 'ec-key';
import NodeRSA from 'node-rsa';

import HttpError from '../lib/HttpError';
import DeviceFirmwareFileRepository from '../repository/DeviceFirmwareFileRepository';
import type PermissionManager from './PermissionManager';

class DeviceManager {
  _deviceAttributeRepository: DeviceAttributeRepository;

  _deviceFirmwareRepository: DeviceFirmwareFileRepository;

  _deviceKeyRepository: DeviceKeyObjectRepository;

  _permissionManager: PermissionManager;

  _eventPublisher: EventPublisher;

  constructor(
    deviceAttributeRepository: DeviceAttributeRepository,
    deviceFirmwareRepository: DeviceFirmwareFileRepository,
    deviceKeyRepository: DeviceKeyObjectRepository,
    permissionManager: PermissionManager,
    eventPublisher: EventPublisher,
  ) {
    this._deviceAttributeRepository = deviceAttributeRepository;
    this._deviceFirmwareRepository = deviceFirmwareRepository;
    this._deviceKeyRepository = deviceKeyRepository;
    this._permissionManager = permissionManager;
    this._eventPublisher = eventPublisher;
  }

  async claimDevice(
    deviceID: string,
    userID: number,
  ): Promise<DeviceAttributes> {
    // todo check: we may not need to get attributes from db here.
    const attributes =
      await this._deviceAttributeRepository.findOneByID(deviceID);

    if (!attributes) {
      return this._deviceAttributeRepository.updateByID(deviceID, {
        deviceID,
        ownerID: userID,
        claimCode: null,
      });
    }

    if (attributes.ownerID && attributes.ownerID !== userID) {
      throw new HttpError('The device belongs to someone else.');
    }

    if (attributes.ownerID && attributes.ownerID === userID) {
      throw new HttpError('The device is already claimed.');
    }

    // update connected device attributes
    await this._eventPublisher.publishAndListenForResponse({
      context: { attributes: { ownerID: userID }, deviceID },
      name: SPARK_SERVER_EVENTS.UPDATE_DEVICE_ATTRIBUTES,
    });

    // todo check: we may not need to update attributes in db here.
    return this._deviceAttributeRepository.updateByID(deviceID, {
      ...attributes,
      ownerID: userID,
    });
  }

  async unclaimDevice(deviceID: string): Promise<DeviceAttributes> {
    await this.getByID(deviceID);

    // update connected device attributes
    await this._eventPublisher.publishAndListenForResponse({
      context: { attributes: { ownerID: null }, deviceID },
      name: SPARK_SERVER_EVENTS.UPDATE_DEVICE_ATTRIBUTES,
    });

    return this._deviceAttributeRepository.updateByID(deviceID, {
      ownerID: null,
      deviceID,
      claimCode: null,
    });
  }

  async getAttributesByID(deviceID: string): Promise<DeviceAttributes> {
    return this.getByID(deviceID);
  }

  async getByID(deviceID: string): Promise<DeviceAttributes> {
    const connectedDeviceAttributes =
      await this._eventPublisher.publishAndListenForResponse<
        DeviceAttributes,
        { deviceID: string }
      >({
        context: { deviceID: deviceID.toLowerCase() },
        name: SPARK_SERVER_EVENTS.GET_DEVICE_ATTRIBUTES,
      });

    const attributes =
      !connectedDeviceAttributes.error &&
      this._permissionManager.doesUserHaveAccess(connectedDeviceAttributes)
        ? connectedDeviceAttributes
        : await this._permissionManager.getEntityByID<DeviceAttributes>(
            'deviceAttributes',
            deviceID,
          );

    if (!attributes) {
      throw new HttpError('No device found', 404);
    }

    return {
      ...attributes,
      isConnected: !connectedDeviceAttributes.error,
      lastFlashedAppName: null,
    };
  }

  async getDeviceID(deviceIDorName: string): Promise<string> {
    let device =
      await this._deviceAttributeRepository.findOneByID(deviceIDorName);
    if (device == null) {
      device = await this._deviceAttributeRepository.getByName(deviceIDorName);
    }

    if (device == null) {
      throw new HttpError('No device found', 404);
    }

    const hasPermission = this._permissionManager.doesUserHaveAccess(device);

    if (!hasPermission) {
      throw new HttpError("User doesn't have access", 403);
    }

    return device.deviceID;
  }

  async getAll(): Promise<Array<DeviceAttributes>> {
    const devicesAttributes =
      await this._permissionManager.getAllEntitiesForCurrentUser<DeviceAttributes>(
        'deviceAttributes',
      );

    const devicePromises = await Promise.all(
      devicesAttributes.map(
        async (attributes: DeviceAttributes): Promise<DeviceAttributes> => {
          const pingResponse =
            await this._eventPublisher.publishAndListenForResponse<
              { connected: boolean | undefined; lastHeard: Date | undefined },
              { deviceID: string }
            >({
              context: { deviceID: attributes.deviceID },
              name: SPARK_SERVER_EVENTS.PING_DEVICE,
            });
          return {
            ...attributes,
            isConnected: pingResponse.connected || false,
            lastFlashedAppName: null,
            lastHeard: pingResponse.lastHeard || attributes.lastHeard,
          };
        },
      ),
    );

    return Promise.all(devicePromises);
  }

  async callFunction<TResult>(
    deviceID: string,
    functionName: string,
    functionArguments: Record<string, string>,
  ): Promise<TResult> {
    await this._permissionManager.checkPermissionsForEntityByID(
      'deviceAttributes',
      deviceID,
    );
    const callFunctionResponse =
      await this._eventPublisher.publishAndListenForResponse<
        { result: TResult },
        {
          deviceID: string;
          functionArguments: Record<string, string>;
          functionName: string;
        }
      >({
        context: { deviceID, functionArguments, functionName },
        name: SPARK_SERVER_EVENTS.CALL_DEVICE_FUNCTION,
      });

    const { error, result } = callFunctionResponse;
    if (error) {
      throw new HttpError(error);
    }

    return result;
  }

  async getVariableValue<TResult>(
    deviceID: string,
    variableName: string,
  ): Promise<TResult> {
    await this._permissionManager.checkPermissionsForEntityByID(
      'deviceAttributes',
      deviceID,
    );

    const getVariableResponse =
      await this._eventPublisher.publishAndListenForResponse<
        { result: TResult },
        { deviceID: string; variableName: string }
      >({
        context: { deviceID, variableName },
        name: SPARK_SERVER_EVENTS.GET_DEVICE_VARIABLE_VALUE,
      });

    const { error, result } = getVariableResponse;
    if (error) {
      throw new HttpError(error);
    }

    return result;
  }

  async forceFirmwareUpdate(deviceID: string): Promise<void> {
    await this._permissionManager.checkPermissionsForEntityByID(
      'deviceAttributes',
      deviceID,
    );

    const getVariableResponse =
      await this._eventPublisher.publishAndListenForResponse({
        context: { deviceID },
        name: SPARK_SERVER_EVENTS.FORCE_UPDATES_FOR_DEVICE,
      });

    const { error } = getVariableResponse;
    if (error) {
      throw new HttpError(error);
    }
  }

  async flashBinary(
    deviceID: string,
    file: Express.Multer.File,
  ): Promise<{
    status: number;
  }> {
    await this._permissionManager.checkPermissionsForEntityByID(
      'deviceAttributes',
      deviceID,
    );

    const flashResponse =
      await this._eventPublisher.publishAndListenForResponse<
        {
          status: number;
        },
        { deviceID: string; fileBuffer: Buffer; fileName: string }
      >({
        context: { deviceID, fileBuffer: file.buffer, fileName: file.filename },
        name: SPARK_SERVER_EVENTS.FLASH_DEVICE,
      });

    const { error } = flashResponse;
    if (error) {
      throw new HttpError(error);
    }

    return flashResponse;
  }

  async flashKnownApp(
    deviceID: string,
    appName: string,
  ): Promise<{
    status: number;
  }> {
    await this._permissionManager.checkPermissionsForEntityByID(
      'deviceAttributes',
      deviceID,
    );

    const knownFirmware = this._deviceFirmwareRepository.getByName(appName);

    if (!knownFirmware) {
      throw new HttpError(`No firmware ${appName} found`, 404);
    }

    const flashResponse =
      await this._eventPublisher.publishAndListenForResponse<
        {
          status: number;
        },
        { deviceID: string; fileBuffer: Buffer; fileName: string }
      >({
        context: { deviceID, fileBuffer: knownFirmware, fileName: appName },
        name: SPARK_SERVER_EVENTS.FLASH_DEVICE,
      });

    const { error } = flashResponse;
    if (error) {
      throw new HttpError(error);
    }

    return flashResponse;
  }

  flashProductFirmware(productID: number, deviceID: string | null = null) {
    this._eventPublisher.publish({
      context: { deviceID, productID },
      name: SPARK_SERVER_EVENTS.FLASH_PRODUCT_FIRMWARE,
    });
  }

  async ping(deviceID: string): Promise<{
    error?: Error | undefined;
  }> {
    await this._permissionManager.checkPermissionsForEntityByID(
      'deviceAttributes',
      deviceID,
    );
    return this._eventPublisher.publishAndListenForResponse<
      { connected: boolean | undefined; lastHeard: Date | undefined },
      { deviceID: string }
    >({
      context: { deviceID },
      name: SPARK_SERVER_EVENTS.PING_DEVICE,
    });
  }

  async provision(
    deviceID: string,
    userID: number,
    publicKey: string,
    algorithm: DeviceKeyAlgorithm,
  ): Promise<DeviceAttributes> {
    if (algorithm === 'ecc') {
      try {
        const eccKey = new ECKey(publicKey, 'pem');
        if (eccKey.isPrivateECKey) {
          throw new HttpError('Not a public key');
        }
      } catch (error) {
        throw new HttpError(`Key error ${error}`);
      }
    } else {
      try {
        const createdKey = new NodeRSA(publicKey);
        if (!createdKey.isPublic()) {
          throw new HttpError('Not a public key');
        }
      } catch (error) {
        throw new HttpError(`Key error ${error}`);
      }
    }

    const existingDeviceKey =
      await this._deviceKeyRepository.findOneByID(deviceID);

    const creationParams = {
      ...existingDeviceKey,
      algorithm,
      deviceID,
      key: Buffer.from(publicKey),
    };
    if (existingDeviceKey) {
      await this._deviceKeyRepository.updateByID(deviceID, creationParams);
    } else {
      await this._deviceKeyRepository.create(creationParams);
    }

    const deviceAttributes =
      await this._deviceAttributeRepository.findOneByID(deviceID);
    if (deviceAttributes) {
      await this._deviceAttributeRepository.updateByID(deviceID, {
        ...deviceAttributes,
        ownerID: userID,
      });
    } else {
      // Create empty DeviceAttributes
      await this._deviceAttributeRepository.create({
        deviceID,
        ownerID: userID,
        name: NAME_GENERATOR.choose(),
      });
    }

    return this.getByID(deviceID);
  }

  async raiseYourHand(
    deviceID: string,
    shouldShowSignal: boolean,
  ): Promise<void> {
    await this._permissionManager.checkPermissionsForEntityByID(
      'deviceAttributes',
      deviceID,
    );

    const raiseYourHandResponse =
      await this._eventPublisher.publishAndListenForResponse({
        context: { deviceID, shouldShowSignal },
        name: SPARK_SERVER_EVENTS.RAISE_YOUR_HAND,
      });

    const { error } = raiseYourHandResponse;
    if (error) {
      throw new HttpError(error);
    }
  }

  async renameDevice(
    deviceID: string,
    name: string,
  ): Promise<DeviceAttributes> {
    const attributes = await this.getAttributesByID(deviceID);

    // update connected device attributes
    await this._eventPublisher.publishAndListenForResponse({
      context: { attributes: { name }, deviceID },
      name: SPARK_SERVER_EVENTS.UPDATE_DEVICE_ATTRIBUTES,
    });

    return this._deviceAttributeRepository.updateByID(deviceID, {
      ...attributes,
      name,
    });
  }
}

export default DeviceManager;
