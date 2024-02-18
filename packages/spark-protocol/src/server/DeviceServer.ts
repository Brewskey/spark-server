import type { Socket } from 'net';
import net from 'net';
import crypto from 'crypto';
import nullthrows from 'nullthrows';
import moment from 'moment';
import Moniker from 'moniker';
import type { ParsedPacket as CoapPacket } from 'coap-packet';
import type {
  AttributesEventContext,
  EventData,
  FlashEventContext,
  FunctionEventContext,
  IDeviceAttributeRepository,
  IProductDeviceRepository,
  IProductFirmwareRepository,
  PingEventContext,
  ProductDevice,
  ProtocolEvent,
  PublishOptions,
  ShouldShowSignalEventContext,
  VariableEventContext,
} from '../types';
import type ClaimCodeManager from '../lib/ClaimCodeManager';
import type CryptoManager from '../lib/CryptoManager';
import type EventPublisher from '../lib/EventPublisher';
import settings from '../settings';

import Handshake from '../lib/Handshake';

import Device from '../clients/Device';

import FirmwareManager from '../lib/FirmwareManager';
import CoapMessages from '../lib/CoapMessages';
import { getRequestEventName } from '../lib/EventPublisher';
import SPARK_SERVER_EVENTS from '../lib/SparkServerEvents';
import {
  DEVICE_EVENT_NAMES,
  DEVICE_MESSAGE_EVENTS_NAMES,
  DEVICE_STATUS_MAP,
  SYSTEM_EVENT_NAMES,
} from '../clients/Device';
import Logger from '../lib/logger';

const { SOCKET_TIMEOUT } = settings;

const logger = Logger.createModuleLogger(module);

type DeviceServerConfig = {
  HOST: string;
  PORT: number;
};

const NAME_GENERATOR = Moniker.generator([Moniker.adjective, Moniker.noun]);

const SPECIAL_EVENTS = [
  SYSTEM_EVENT_NAMES.APP_HASH,
  SYSTEM_EVENT_NAMES.FLASH_AVAILABLE,
  SYSTEM_EVENT_NAMES.FLASH_PROGRESS,
  SYSTEM_EVENT_NAMES.FLASH_STATUS,
  SYSTEM_EVENT_NAMES.SAFE_MODE,
  SYSTEM_EVENT_NAMES.SPARK_STATUS,
  SYSTEM_EVENT_NAMES.UPDATES_ENABLED,
  SYSTEM_EVENT_NAMES.UPDATES_FORCED,
];

let connectionIdCounter = 0;
let handshakeCounter = 0;

class DeviceServer {
  _areSystemFirmwareAutoupdatesEnabled: boolean;

  _claimCodeManager: ClaimCodeManager;

  _connectedDevicesLoggingInterval: number;

  _config: DeviceServerConfig;

  _cryptoManager: CryptoManager;

  _deviceAttributeRepository: IDeviceAttributeRepository;

  _devicesById: Map<string, Device> = new Map();

  _eventPublisher: EventPublisher;

  _productDeviceRepository: IProductDeviceRepository;

  _productFirmwareRepository: IProductFirmwareRepository;

  _allowDeviceToProvidePem: boolean;

  _socketQueue: Array<Socket> = [];

  constructor(
    deviceAttributeRepository: IDeviceAttributeRepository,
    productDeviceRepository: IProductDeviceRepository,
    productFirmwareRepository: IProductFirmwareRepository,
    claimCodeManager: ClaimCodeManager,
    cryptoManager: CryptoManager,
    eventPublisher: EventPublisher,
    deviceServerConfig: DeviceServerConfig,
    areSystemFirmwareAutoupdatesEnabled: boolean,
    connectedDevicesLoggingInterval: number,
    allowDeviceToProvidePem: boolean,
  ) {
    this._areSystemFirmwareAutoupdatesEnabled =
      areSystemFirmwareAutoupdatesEnabled;
    this._connectedDevicesLoggingInterval = connectedDevicesLoggingInterval;
    this._config = deviceServerConfig;
    this._cryptoManager = cryptoManager;
    this._claimCodeManager = claimCodeManager;
    this._deviceAttributeRepository = deviceAttributeRepository;
    this._eventPublisher = eventPublisher;
    this._productDeviceRepository = productDeviceRepository;
    this._productFirmwareRepository = productFirmwareRepository;
    this._allowDeviceToProvidePem = allowDeviceToProvidePem;
  }

  start() {
    this._eventPublisher.subscribe(
      getRequestEventName(SPARK_SERVER_EVENTS.CALL_DEVICE_FUNCTION),
      this._onSparkServerCallDeviceFunctionRequest.bind(this),
    );

    this._eventPublisher.subscribe(
      getRequestEventName(SPARK_SERVER_EVENTS.FLASH_DEVICE),
      this._onSparkServerFlashDeviceRequest.bind(this),
    );

    this._eventPublisher.subscribe(
      getRequestEventName(SPARK_SERVER_EVENTS.GET_DEVICE_ATTRIBUTES),
      this._onSparkServerGetDeviceAttributes.bind(this),
    );

    this._eventPublisher.subscribe(
      getRequestEventName(SPARK_SERVER_EVENTS.GET_DEVICE_VARIABLE_VALUE),
      this._onSparkServerGetDeviceVariableValueRequest.bind(this),
    );

    this._eventPublisher.subscribe(
      getRequestEventName(SPARK_SERVER_EVENTS.PING_DEVICE),
      this._onSparkServerPingDeviceRequest.bind(this),
    );

    this._eventPublisher.subscribe(
      getRequestEventName(SPARK_SERVER_EVENTS.RAISE_YOUR_HAND),
      this._onSparkServerRaiseYourHandRequest.bind(this),
    );

    this._eventPublisher.subscribe(
      getRequestEventName(SPARK_SERVER_EVENTS.UPDATE_DEVICE_ATTRIBUTES),
      this._onSparkServerUpdateDeviceAttributesRequest.bind(this),
    );

    this._eventPublisher.subscribe(
      SPARK_SERVER_EVENTS.FLASH_PRODUCT_FIRMWARE,
      this._onFlashProductFirmware.bind(this),
    );

    const server = net.createServer((socket: Socket): void =>
      process.nextTick(() => {
        socket.setTimeout(SOCKET_TIMEOUT);
        this._enqueueSocketForHandshake(socket);
      }),
    );

    setInterval(() => {
      this._processSockets();
    }, 100);

    setInterval(
      (): void =>
        server.getConnections((error: Error | null, count: number) => {
          const logParams = {
            devices: this._devicesById.size,
            sockets: count,
            handshakeCounter,
            socketQueueLength: this._socketQueue.length,
          };
          if (error) {
            logger.error(
              { ...logParams, error },
              'Error with Connected Devices',
            );
          } else {
            logger.info(logParams, 'Connected Devices');
          }
        }),
      this._connectedDevicesLoggingInterval,
    );

    server.on('error', (error: Error): void =>
      logger.error({ err: error }, 'something blew up'),
    );

    const serverPort = this._config.PORT.toString();
    server.listen(serverPort, (): void =>
      logger.info({ serverPort }, 'Server started'),
    );
  }

  async _updateDeviceSystemFirmware(device: Device) {
    await device.hasStatus(DEVICE_STATUS_MAP.READY);
    const { deviceID, ownerID } = device.getAttributes();
    const systemInformation = device.getSystemInformation();

    const config =
      await FirmwareManager.getOtaSystemUpdateConfig(systemInformation);
    if (!config) {
      const missingModules =
        await FirmwareManager.getMissingModules(systemInformation);
      if (missingModules?.length) {
        logger.error({
          msg: 'Device has missing modules but no OTA update',
          deviceID,
          systemInformation: JSON.stringify(systemInformation),
          missingModules: JSON.stringify(missingModules),
        });
      } else {
        logger.info('No system updates for device', {
          deviceID,
          systemInformation: JSON.stringify(systemInformation),
        });
      }

      return;
    }

    setTimeout(async () => {
      this.publishSpecialEvent(
        SYSTEM_EVENT_NAMES.SAFE_MODE_UPDATING,
        // Lets the user know if it's the system update part 1/2/3
        config.allModuleIndices[0].toString(),
        deviceID,
        ownerID,
        false,
      );

      logger.info('Flashing OTA System Firmware', {
        filename: config.allUpdateFiles[0],
        deviceId: device.getDeviceID(),
        systemInformation: JSON.stringify(systemInformation),
      });

      await device.flash(config.systemFile);
    }, 100);
  }

  async _checkProductFirmwareForUpdate(
    device: Device,
    /* appModule: Object, */
  ) {
    const productDevice = await this._productDeviceRepository.getFromDeviceID(
      device.getDeviceID(),
    );

    await this._flashDevice(productDevice);
  }

  _enqueueSocketForHandshake(socket: Socket) {
    this._socketQueue.push(socket);
  }

  _processSockets() {
    while (handshakeCounter < 50 && this._socketQueue.length) {
      const socket = this._socketQueue.shift();
      if (socket && !socket.destroyed) {
        handshakeCounter += 1;
        this._onNewSocketConnection(socket);
      }
    }
  }

  async _onNewSocketConnection(socket: Socket) {
    let deviceID: string = '';
    try {
      logger.info('New Connection');
      connectionIdCounter += 1;
      const counter = connectionIdCounter;
      const connectionKey = `_${connectionIdCounter}`;
      const handshake = new Handshake(
        this._cryptoManager,
        this._allowDeviceToProvidePem,
      );
      const device = new Device(socket, connectionKey, handshake);

      deviceID = await device.startProtocolInitialization();

      logger.info(
        {
          connectionID: counter,
          deviceID,
          remoteIPAddress: device.getRemoteIPAddress(),
        },
        'Connection',
      );

      try {
        device.on(DEVICE_EVENT_NAMES.DISCONNECT, () =>
          this._onDeviceDisconnect(device),
        );

        device.on(DEVICE_MESSAGE_EVENTS_NAMES.SUBSCRIBE, (packet: CoapPacket) =>
          this._onDeviceSubscribe(packet, device),
        );

        device.on(
          DEVICE_MESSAGE_EVENTS_NAMES.PRIVATE_EVENT,
          (packet: CoapPacket) =>
            this._onDeviceSentMessage(packet, /* isPublic */ false, device),
        );

        device.on(
          DEVICE_MESSAGE_EVENTS_NAMES.PUBLIC_EVENT,
          (packet: CoapPacket) =>
            this._onDeviceSentMessage(packet, /* isPublic */ true, device),
        );

        device.on(
          DEVICE_MESSAGE_EVENTS_NAMES.GET_TIME,
          (packet: CoapPacket): void =>
            DeviceServer._onDeviceGetTime(packet, device),
        );

        // TODO in the next 3 subscriptions for flashing events
        // there is code duplication, its not clean, but
        // i guess we'll remove these subscription soon anyways
        // so I keep it like this for now.
        device.on(DEVICE_EVENT_NAMES.FLASH_STARTED, async () => {
          await device.hasStatus(DEVICE_STATUS_MAP.READY);
          const { ownerID } = device.getAttributes();
          this.publishSpecialEvent(
            SYSTEM_EVENT_NAMES.FLASH_STATUS,
            'started',
            deviceID,
            ownerID,
            false,
          );
        });

        device.on(DEVICE_EVENT_NAMES.FLASH_SUCCESS, async () => {
          await device.hasStatus(DEVICE_STATUS_MAP.READY);
          const { ownerID } = device.getAttributes();
          this.publishSpecialEvent(
            SYSTEM_EVENT_NAMES.FLASH_STATUS,
            'success',
            deviceID,
            ownerID,
            false,
          );
        });

        device.on(DEVICE_EVENT_NAMES.FLASH_FAILED, async () => {
          await device.hasStatus(DEVICE_STATUS_MAP.READY);
          const { ownerID } = device.getAttributes();
          this.publishSpecialEvent(
            SYSTEM_EVENT_NAMES.FLASH_STATUS,
            'failed',
            deviceID,
            ownerID,
            false,
          );
        });

        if (this._devicesById.has(deviceID)) {
          const existingConnection = this._devicesById.get(deviceID);
          nullthrows(existingConnection).disconnect(
            'Device was already connected. Reconnecting.',
          );
        }

        this._devicesById.set(deviceID, device);

        const systemInformation = await device.completeProtocolInitialization();

        let appModules;
        try {
          appModules = FirmwareManager.getAppModule(systemInformation);
        } catch (_ignore) {
          appModules = { uuid: 'none' };
        }

        const { uuid: appHash } = appModules;

        await this._checkProductFirmwareForUpdate(device /* appModule */);

        const existingAttributes =
          await this._deviceAttributeRepository.getByID(deviceID);

        const {
          claimCode,
          currentBuildTarget,
          imei,
          isCellular,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          last_iccid,
          name,
          ownerID,
          registrar,
        } = existingAttributes || {};

        device.updateAttributes({
          appHash,
          claimCode,
          currentBuildTarget,
          imei,
          isCellular,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          last_iccid,
          lastHeard: new Date(),
          name: name || NAME_GENERATOR.choose(),
          ownerID,
          registrar,
        });

        device.setStatus(DEVICE_STATUS_MAP.READY);
        this.publishSpecialEvent(
          SYSTEM_EVENT_NAMES.SPARK_STATUS,
          'online',
          deviceID,
          ownerID,
          false,
        );

        // TODO
        // we may update attributes only on disconnect, but currently
        // removing update here can break claim/provision flow
        // so need to test carefully before doing this.
        await this._deviceAttributeRepository.updateByID(
          deviceID,
          device.getAttributes(),
        );

        // Send app-hash if this is a new app firmware
        if (!existingAttributes || appHash !== existingAttributes.appHash) {
          this.publishSpecialEvent(
            SYSTEM_EVENT_NAMES.APP_HASH,
            appHash,
            deviceID,
            ownerID,
            false,
          );
        }

        device.emit(DEVICE_EVENT_NAMES.READY);
      } catch (error) {
        logger.error({ deviceID, err: error }, 'Connection Error');
        if (error instanceof Error) {
          device.disconnect(
            `Error during connection: ${error}: ${error.stack}`,
          );
        } else {
          device.disconnect(`Error during connection: ${error}`);
        }
      }
    } catch (outerError) {
      logger.error(
        { deviceID: deviceID ?? '', err: outerError },
        'Device startup failed',
      );
    }

    handshakeCounter -= 1;
  }

  async _onDeviceDisconnect(device: Device) {
    const attributes = device.getAttributes();
    const { deviceID, ownerID } = attributes;

    const newDevice = this._devicesById.get(deviceID);
    const connectionKey = device.getConnectionKey();
    if (device !== newDevice) {
      return;
    }

    this._devicesById.delete(deviceID);
    this._eventPublisher.unsubscribeBySubscriberID(deviceID);

    if (device.getStatus() === DEVICE_STATUS_MAP.READY) {
      await this._deviceAttributeRepository.updateByID(deviceID, attributes);
    }

    this.publishSpecialEvent(
      SYSTEM_EVENT_NAMES.SPARK_STATUS,
      'offline',
      deviceID,
      ownerID,
      false,
    );
    logger.warn(
      {
        connectionKey,
        deviceID,
        ownerID,
      },
      'Session ended for Device',
    );
  }

  static _onDeviceGetTime(packet: CoapPacket, device: Device) {
    const timeStamp = moment().utc().unix();
    const binaryValue = CoapMessages.toBinary(timeStamp, 'uint32');

    device.sendReply(
      'GetTimeReturn',
      packet.messageId,
      binaryValue,
      packet.token.length ? packet.token.readUInt8(0) : 0,
    );
  }

  async _onDeviceSentMessage(
    packet: CoapPacket,
    isPublic: boolean,
    device: Device,
  ) {
    let deviceID = null;
    let name = null;
    let ownerID = null;
    try {
      await device.hasStatus(DEVICE_STATUS_MAP.READY);
      ({ deviceID, name, ownerID } = device.getAttributes());

      const eventData: EventData<void> = {
        connectionID: device.getConnectionKey(),
        data: packet.payload.toString('utf8'),
        deviceID,
        name: CoapMessages.getUriPath(packet).substr(3),
        ttl: CoapMessages.getMaxAge(packet),
      };
      const publishOptions: PublishOptions = {
        isInternal: false,
        isPublic,
      };
      const eventName = eventData.name.toLowerCase();

      let shouldSwallowEvent = false;

      logger.error(eventData);

      // All spark events except special events should be hidden from the
      // event stream.
      if (eventName.startsWith('spark')) {
        // These should always be private but let's make sure. This way
        // if you are listening to a specific device you only see the system
        // events from it.
        publishOptions.isPublic = false;

        shouldSwallowEvent =
          !SPECIAL_EVENTS.some((specialEvent: string): boolean =>
            eventName.startsWith(specialEvent),
          ) || device.isFlashing();
        if (shouldSwallowEvent) {
          device.sendReply('EventAck', packet.messageId);
        }
      }

      if (!shouldSwallowEvent && ownerID) {
        this._eventPublisher.publish(
          { ...eventData, userID: ownerID },
          publishOptions,
        );
      }

      if (eventName.startsWith(SYSTEM_EVENT_NAMES.CLAIM_CODE)) {
        await this._onDeviceClaimCodeMessage(packet, device);
      }

      if (eventName.startsWith(SYSTEM_EVENT_NAMES.GET_IP)) {
        this.publishSpecialEvent(
          SYSTEM_EVENT_NAMES.GET_NAME,
          device.getRemoteIPAddress(),
          deviceID,
          ownerID,
          false,
        );
      }

      if (eventName.startsWith(SYSTEM_EVENT_NAMES.GET_NAME)) {
        this.publishSpecialEvent(
          SYSTEM_EVENT_NAMES.GET_NAME,
          name,
          deviceID,
          ownerID,
          false,
        );
      }

      if (eventName.startsWith(SYSTEM_EVENT_NAMES.GET_RANDOM_BUFFER)) {
        const cryptoString = crypto
          .randomBytes(40)
          .toString('base64')
          .substring(0, 40);

        this.publishSpecialEvent(
          SYSTEM_EVENT_NAMES.GET_RANDOM_BUFFER,
          cryptoString,
          deviceID,
          ownerID,
          false,
        );
      }

      if (eventName.startsWith(SYSTEM_EVENT_NAMES.IDENTITY)) {
        // TODO - open up for possibility of retrieving multiple ID datums
        // This is mostly for electron - You can get the IMEI and IICCID this way
        // https://github.com/spark/firmware/blob/develop/system/src/system_cloud_internal.cpp#L682-L685
        // https://github.com/spark/firmware/commit/73df5a4ac4c64f008f63a495d50f866d724c6201
      }

      if (eventName.startsWith(SYSTEM_EVENT_NAMES.LAST_RESET)) {
        this.publishSpecialEvent(
          SYSTEM_EVENT_NAMES.LAST_RESET,
          eventData.data,
          deviceID,
          ownerID,
          false,
        );
      }

      if (eventName.startsWith(SYSTEM_EVENT_NAMES.MAX_BINARY)) {
        device.setMaxBinarySize(
          Number.parseInt(nullthrows(eventData.data), 10),
        );
      }

      if (eventName.startsWith(SYSTEM_EVENT_NAMES.OTA_CHUNK_SIZE)) {
        device.setOtaChunkSize(Number.parseInt(nullthrows(eventData.data), 10));
      }

      if (eventName.startsWith(SYSTEM_EVENT_NAMES.SAFE_MODE)) {
        this.publishSpecialEvent(
          SYSTEM_EVENT_NAMES.SAFE_MODE,
          eventData.data,
          deviceID,
          ownerID,
          false,
        );

        if (this._areSystemFirmwareAutoupdatesEnabled) {
          await this._updateDeviceSystemFirmware(device);
        }
      }

      if (eventName.startsWith(SYSTEM_EVENT_NAMES.SPARK_SUBSYSTEM)) {
        // TODO: Test this with a Core device
        // get patch version from payload
        // compare with version on disc
        // if device version is old, do OTA update with patch
      }

      if (
        eventName.startsWith(SYSTEM_EVENT_NAMES.UPDATES_ENABLED) ||
        eventName.startsWith(SYSTEM_EVENT_NAMES.UPDATES_FORCED)
      ) {
        // const binaryValue = CoapMessages.toBinary(1, 'uint8');
        // device.sendReply(
        //   'UpdatesReply',
        //   packet.messageId,
        //   binaryValue,
        //   packet.token.length ? packet.token.readUInt8(0) : 0,
        // );
      }
    } catch (error) {
      logger.error({ deviceID, err: error }, 'Device Server Error');
    }
  }

  async _onDeviceClaimCodeMessage(packet: CoapPacket, device: Device) {
    await device.hasStatus(DEVICE_STATUS_MAP.READY);
    const claimCode = packet.payload.toString('utf8');
    const {
      claimCode: previousClaimCode,
      deviceID,
      ownerID,
    } = device.getAttributes();

    if (ownerID || claimCode === previousClaimCode) {
      return;
    }

    const claimRequestUserID =
      this._claimCodeManager.getUserIDByClaimCode(claimCode);
    if (!claimRequestUserID) {
      return;
    }

    device.updateAttributes({
      claimCode,
      ownerID: claimRequestUserID,
    });
    await this._deviceAttributeRepository.updateByID(deviceID, {
      claimCode,
      ownerID: claimRequestUserID,
    });

    this._claimCodeManager.removeClaimCode(claimCode);
  }

  async _onDeviceSubscribe(packet: CoapPacket, device: Device) {
    await device.hasStatus(DEVICE_STATUS_MAP.READY);
    process.nextTick(() => {
      const deviceAttributes = device.getAttributes();
      const { deviceID } = deviceAttributes;
      let { ownerID } = deviceAttributes;

      // uri -> /e/?u    --> firehose for all my devices
      // uri -> /e/ (deviceid in body)   --> allowed
      // uri -> /e/    --> not allowed (no global firehose for cores, kthxplox)
      // uri -> /e/event_name?u    --> all my devices
      // uri -> /e/event_name?u (deviceid)    --> deviceid?
      const messageName = CoapMessages.getUriPath(packet).substr(3);
      const query = CoapMessages.getUriQuery(packet);
      const isFromMyDevices = !!query.match('u');

      if (!messageName) {
        device.sendReply('SubscribeFail', packet.messageId);
        return;
      }

      logger.info(
        {
          deviceID,
          isFromMyDevices,
          messageName,
          query,
        },
        'Subscribe Request',
      );

      device.sendReply('SubscribeAck', packet.messageId);

      if (!ownerID) {
        logger.info(
          {
            deviceID,
            messageName,
          },
          'device wasnt subscribed to event: the device is unclaimed.',
        );
        ownerID = '--unclaimed--';
      }

      const isSystemEvent = messageName.startsWith('spark');

      this._eventPublisher.subscribe(
        messageName,
        async (...params) => device.onDeviceEvent(...params),
        {
          filterOptions: {
            connectionID: isSystemEvent ? device.getConnectionKey() : undefined,
            mydevices: isFromMyDevices,
            userID: ownerID,
          },
          subscriberID: deviceID,
        },
      );
    });
  }

  async _onSparkServerCallDeviceFunctionRequest(
    event: ProtocolEvent<FunctionEventContext>,
  ) {
    const { deviceID, functionArguments, functionName, responseEventName } =
      nullthrows(event.context);
    try {
      const device = this.getDevice(deviceID);
      if (!device) {
        throw new Error('Could not get device for ID');
      }

      this._eventPublisher.publish(
        {
          context: {
            result: await device.callFunction(functionName, functionArguments),
          },
          name: responseEventName,
        },
        {
          isInternal: true,
          isPublic: false,
        },
      );
    } catch (error) {
      this._eventPublisher.publish(
        {
          context: { error },
          name: responseEventName,
        },
        {
          isInternal: true,
          isPublic: false,
        },
      );
    }
  }

  async _onSparkServerFlashDeviceRequest(
    event: ProtocolEvent<FlashEventContext>,
  ) {
    const { deviceID, fileBuffer, responseEventName, fileName } = nullthrows(
      event.context,
    );
    try {
      const device = this.getDevice(deviceID);
      if (!device) {
        throw new Error('Could not get device for ID');
      }

      logger.info('Flashing Uploaded Product Firmware', {
        deviceId: device.getDeviceID(),
        fileName,
      });
      this._eventPublisher.publish(
        {
          context: await device.flash(fileBuffer),
          name: responseEventName,
        },
        {
          isInternal: true,
          isPublic: false,
        },
      );
    } catch (error) {
      this._eventPublisher.publish(
        {
          context: { error },
          name: responseEventName,
        },
        {
          isInternal: true,
          isPublic: false,
        },
      );
    }
  }

  async _onSparkServerGetDeviceAttributes(
    event: ProtocolEvent<AttributesEventContext>,
  ) {
    const { deviceID, responseEventName } = nullthrows(event.context);

    try {
      const device = this.getDevice(deviceID);
      if (!device) {
        throw new Error('Could not get device for ID');
      }
      await device.hasStatus(DEVICE_STATUS_MAP.READY);

      this._eventPublisher.publish(
        {
          context: device.getAttributes(),
          name: responseEventName,
        },
        {
          isInternal: true,
          isPublic: false,
        },
      );
    } catch (error) {
      this._eventPublisher.publish(
        {
          context: { error },
          name: responseEventName,
        },
        {
          isInternal: true,
          isPublic: false,
        },
      );
    }
  }

  async _onSparkServerGetDeviceVariableValueRequest(
    event: ProtocolEvent<VariableEventContext>,
  ) {
    const { deviceID, responseEventName, variableName } = nullthrows(
      event.context,
    );

    try {
      const device = this.getDevice(deviceID);
      if (!device) {
        throw new Error('Could not get device for ID');
      }

      this._eventPublisher.publish(
        {
          context: { result: await device.getVariableValue(variableName) },
          name: responseEventName,
        },
        {
          isInternal: true,
          isPublic: false,
        },
      );
    } catch (error) {
      this._eventPublisher.publish(
        {
          context: { error },
          name: responseEventName,
        },
        {
          isInternal: true,
          isPublic: false,
        },
      );
    }
  }

  async _onSparkServerPingDeviceRequest(
    event: ProtocolEvent<PingEventContext>,
  ) {
    const { deviceID, responseEventName } = nullthrows(event.context);

    const device = this.getDevice(deviceID);
    const pingObject = device
      ? device.ping()
      : {
          connected: false,
          lastPing: null,
        };

    this._eventPublisher.publish(
      {
        context: pingObject,
        name: responseEventName,
      },
      {
        isInternal: true,
        isPublic: false,
      },
    );
  }

  async _onSparkServerRaiseYourHandRequest(
    event: ProtocolEvent<ShouldShowSignalEventContext>,
  ) {
    const { deviceID, responseEventName, shouldShowSignal } = nullthrows(
      event.context,
    );

    try {
      const device = this.getDevice(deviceID);
      if (!device) {
        throw new Error('Could not get device for ID');
      }

      await device.hasStatus(DEVICE_STATUS_MAP.READY);

      this._eventPublisher.publish(
        {
          context: await device.raiseYourHand(shouldShowSignal),
          name: responseEventName,
        },
        {
          isInternal: true,
          isPublic: false,
        },
      );
    } catch (error) {
      this._eventPublisher.publish(
        {
          context: { error },
          name: responseEventName,
        },
        {
          isInternal: true,
          isPublic: false,
        },
      );
    }
  }

  async _onSparkServerUpdateDeviceAttributesRequest(
    event: ProtocolEvent<AttributesEventContext>,
  ) {
    const { attributes, deviceID, responseEventName } = nullthrows(
      event.context,
    );

    try {
      const device = this.getDevice(deviceID);
      if (!device) {
        throw new Error('Could not get device for ID');
      }

      await device.hasStatus(DEVICE_STATUS_MAP.READY);
      device.updateAttributes({ ...attributes });

      this._eventPublisher.publish(
        {
          context: await device.getAttributes(),
          name: responseEventName,
        },
        {
          isInternal: true,
          isPublic: false,
        },
      );
    } catch (error) {
      this._eventPublisher.publish(
        {
          context: { error },
          name: responseEventName,
        },
        {
          isInternal: true,
          isPublic: false,
        },
      );
    }
  }

  async _onFlashProductFirmware(event: ProtocolEvent<FlashEventContext>) {
    const { deviceID, productID } = nullthrows(event.context);

    // Handle case where a new device is added to an existing product
    if (deviceID) {
      const productDevice =
        await this._productDeviceRepository.getFromDeviceID(deviceID);

      if (!productDevice || productDevice.productID !== productID) {
        throw new Error(
          `Device ${deviceID} does not belong to product ${productID}`,
        );
      }

      await this._flashDevice(productDevice);

      return;
    }

    // NOTE - In a giant system, this is probably a bad idea but
    // we can worry about scaling this later. It will also be
    // inefficient if there is any horizontal scaling :/
    const productDevices =
      await this._productDeviceRepository.getAllByProductID(
        productID,
        0,
        Number.MAX_VALUE,
      );

    // TODO - FIgure out if this breaks things for large amounts
    // of devices. We will probably need to test with
    // particle-collider. I used setImmediate and only flash
    // one device at a time in hopes of limiting the server load
    while (productDevices.length) {
      const productDevice = productDevices.pop();
      // eslint-disable-next-line @typescript-eslint/no-loop-func
      await new Promise((resolve: (value: void) => void) => {
        setImmediate(async () => {
          await this._flashDevice(productDevice);
          resolve();
        });
      });
    }
  }

  async _flashDevice(productDevice?: ProductDevice | null) {
    if (
      !productDevice ||
      productDevice.denied ||
      productDevice.development ||
      productDevice.quarantined
    ) {
      return;
    }

    const device = this._devicesById.get(productDevice.deviceID);
    if (!device) {
      return;
    }

    if (device.isFlashing()) {
      logger.info(productDevice, 'Device already flashing');
      return;
    }

    let productFirmware = null;

    const { lockedFirmwareVersion } = productDevice;
    const { productFirmwareVersion, particleProductId } =
      device.getAttributes();
    if (
      particleProductId === productDevice.productID &&
      lockedFirmwareVersion === productFirmwareVersion
    ) {
      return;
    }

    if (lockedFirmwareVersion !== null) {
      productFirmware =
        await this._productFirmwareRepository.getByVersionForProduct(
          productDevice.productID,
          nullthrows(lockedFirmwareVersion),
        );
    } else {
      productFirmware =
        await this._productFirmwareRepository.getCurrentForProduct(
          productDevice.productID,
        );
    }

    if (!productFirmware) {
      return;
    }

    // TODO - check appHash as well.  We should be saving this alongside the firmware
    if (
      productFirmware.product_id === particleProductId &&
      productFirmware.version === productFirmwareVersion
    ) {
      return;
    }

    const systemInformation = device.getSystemInformation();
    const missingModules =
      await FirmwareManager.getMissingModules(systemInformation);

    if (missingModules?.length) {
      logger.info('Device missing dependencies', {
        deviceId: device.getDeviceID(),
        systemInformation: JSON.stringify(systemInformation),
        missingModules: JSON.stringify(missingModules),
      });
      return;
    }

    const { data, ...loggingInfo } = productFirmware;
    logger.info('Flashing Product Firmware', {
      deviceId: device.getDeviceID(),
      ...loggingInfo,
    });
    await device.flash(productFirmware.data);
    const oldProductFirmware =
      await this._productFirmwareRepository.getByVersionForProduct(
        productDevice.productID,
        productFirmwareVersion,
      );

    // Update the number of devices on the firmware versions
    if (oldProductFirmware) {
      await this._productFirmwareRepository.updateByID(
        oldProductFirmware.id,
        oldProductFirmware,
      );
    }
    await this._productFirmwareRepository.updateByID(
      productFirmware.id,
      productFirmware,
    );
  }

  getDevice(deviceID: string): Device | null | undefined {
    return this._devicesById.get(deviceID);
  }

  publishSpecialEvent(
    eventName: string,
    data: string | null | undefined,
    deviceID: string,
    userID?: string | null,
    isInternal: boolean = false,
  ) {
    if (!userID) {
      return;
    }
    const eventData = {
      data,
      deviceID,
      name: eventName,
      userID,
    } as const;
    process.nextTick(() => {
      this._eventPublisher.publish(eventData, { isInternal, isPublic: false });
    });
  }
}

export default DeviceServer;
