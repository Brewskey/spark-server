import type { Socket } from 'net';
import type { Duplex } from 'stream';
import type {
  ParsedPacket as CoapPacket,
  Option as CoapOption,
} from 'coap-packet';
import EventEmitter from 'events';
import nullthrows from 'nullthrows';
import type { DeviceAttributes, ProtocolEvent } from '../types';
import type Handshake from '../lib/Handshake';
import type { MessageType } from '../lib/MessageSpecifications';

import CoapMessage from '../lib/CoapMessage';
import CryptoManager from '../lib/CryptoManager';
import CoapMessages from '../lib/CoapMessages';
import Flasher from '../lib/Flasher';
import settings from '../settings';
import Logger from '../lib/logger';
import BunyanLogger from 'bunyan';
import { FileTransferStore } from '../lib/FileTransferStore';
import { SystemInformation } from 'binary-version-reader';

type FunctionState = {
  f: Array<string> | null | undefined;
  v: Record<string, string> | null | undefined;
};
type DeviceDescription = {
  functionState: FunctionState;
  systemInformation: SystemInformation;
};

type DeviceStatus = 1 | 2 | 3 | 4;

type GetHelloInfo = {
  particleProductId: number;
  platformId: number;
  productFirmwareVersion: number;
  reservedFlags: number;
};

// Hello — sent first by Device then by Server immediately after handshake, never again
// Ignored — sent by either side to respond to a message with a bad counter value.
// The receiver of an Ignored message can optionally decide to resend a previous message
// if the indicated bad counter value matches a recently sent message.

// package flasher
// Chunk — sent by Server to send chunks of a firmware binary to Device
// ChunkReceived — sent by Device to respond to each chunk,
// indicating the CRC of the received chunk data.
// if Server receives CRC that does not match the chunk just sent, that chunk is sent again
// UpdateBegin — sent by Server to initiate an OTA firmware update
// UpdateReady — sent by Device to indicate readiness to receive firmware chunks
// UpdateDone — sent by Server to indicate all firmware chunks have been sent

// FunctionCall — sent by Server to tell Device to call a user-exposed function
// FunctionReturn — sent by Device in response to FunctionCall to indicate return value.
// void functions will not send this message
// VariableRequest — sent by Server to request the value of a user-exposed variable
// VariableValue — sent by Device in response to VariableRequest to indicate the value

// Event — sent by Device to initiate a Server Sent Event and optionally
// an HTTP callback to a 3rd party
// KeyChange — sent by Server to change the AES credentials

/**
 * How high do our counters go before we wrap around to 0?
 * (CoAP maxes out at a 16 bit int)
 */
const COUNTER_MAX = 65536;
/**
 * How big can our tokens be in CoAP messages?
 */
const TOKEN_COUNTER_MAX = 256;
const { KEEP_ALIVE_TIMEOUT } = settings;
const { SOCKET_TIMEOUT } = settings;

export const DEVICE_EVENT_NAMES = {
  DISCONNECT: 'disconnect',
  FLASH_FAILED: 'flash/failed',
  FLASH_STARTED: 'flash/started',
  FLASH_SUCCESS: 'flash/success',
  READY: 'ready',
} as const;

export const SYSTEM_EVENT_NAMES = {
  APP_HASH: 'spark/device/app-hash',
  CLAIM_CODE: 'spark/device/claim/code',
  FLASH_AVAILABLE: 'spark/flash/available',
  FLASH_PROGRESS: 'spark/flash/progress',
  FLASH_STATUS: 'spark/flash/status',
  GET_IP: 'particle/device/ip',
  GET_NAME: 'particle/device/name',
  GET_RANDOM_BUFFER: 'particle/device/random',
  IDENTITY: 'spark/device/ident/0',
  LAST_RESET: 'spark/device/last_reset', // This should just have a friendly string in its payload.
  MAX_BINARY: 'spark/hardware/max_binary',
  OTA_CHUNK_SIZE: 'spark/hardware/ota_chunk_size',
  OTA_RESULT: 'spark/device/ota_result',
  RESET: 'spark/device/reset', // send this to reset passing "safe mode"/"dfu"/"reboot"
  SAFE_MODE: 'spark/device/safemode',
  SAFE_MODE_UPDATING: 'spark/safe-mode-updater/updating',
  SPARK_STATUS: 'spark/status',
  SPARK_SUBSYSTEM: 'spark/cc3000-patch-version',
  UPDATES_ENABLED: 'particle/device/updates/enabled',
  UPDATES_FORCED: 'particle/device/updates/forced',
} as const;

// These constants should be consistent with message names in
// MessageSpecifications.js
export const DEVICE_MESSAGE_EVENTS_NAMES = {
  GET_TIME: 'GetTime',
  PRIVATE_EVENT: 'PrivateEvent',
  PUBLIC_EVENT: 'PublicEvent',
  SUBSCRIBE: 'Subscribe',
} as const;

export const DEVICE_STATUS_MAP = {
  GOT_DESCRIPTION: 3,
  GOT_HELLO: 2,
  INITIAL: 1,
  READY: 4,
} as const;

const NEW_STATUS_EVENT_NAME = 'newStatus';

type AttributesFromDevice = {
  particleProductId: number;
  platformId: number;
  productFirmwareVersion: number;
  reservedFlags: number;
};

/**
 * Implementation of the Particle messaging protocol
 * @Device
 */
class Device extends EventEmitter {
  _logger: BunyanLogger;

  _attributes: DeviceAttributes = {
    appHash: null,
    deviceID: '',
    functions: null,
    ip: 'unkonwn',
    lastHeard: null,
    name: '',
    ownerID: null,
    particleProductId: 0,
    platformId: 0,
    productFirmwareVersion: 0,
    registrar: null,
    reservedFlags: 0,
    variables: null,
    lastFlashedAppName: undefined,
    timestamp: new Date(),
    connected: false,
  };

  _attributesFromDevice: AttributesFromDevice = {
    particleProductId: 0,
    platformId: 0,
    productFirmwareVersion: 0,
    reservedFlags: 0,
  };

  _cipherStream: Duplex | null | undefined = null;

  _connectionKey: string | null | undefined = null;

  _connectionStartTime: Date | null | undefined = null;

  _decipherStream: Duplex | null | undefined = null;

  _disconnectCounter: number = 0;

  _isFlashing: boolean = false;

  _maxBinarySize: number | null | undefined = null;

  _otaChunkSize: number | null | undefined = null;

  _owningFlasher: Flasher | null | undefined;

  _receiveCounter: number = 0;

  _sendCounter: number = 0;

  _sendToken: number = 0;

  _socket: Socket;

  _socketTimeoutInterval: ReturnType<typeof setTimeout> | undefined = undefined;

  _status: DeviceStatus = DEVICE_STATUS_MAP.INITIAL;

  _statusEventEmitter: EventEmitter = new EventEmitter();

  _systemInformation: SystemInformation | undefined;

  _tokens: {
    [key: string]: MessageType;
  } = {};

  _handshake: Handshake;

  constructor(socket: Socket, connectionKey: string, handshake: Handshake) {
    super();

    this._connectionKey = connectionKey;
    this._socket = socket;
    this._handshake = handshake;

    this._logger = Logger.createModuleLogger(module, { connectionKey });
  }

  // emit(type, ...args: Array<mixed>) {
  //   const packet = args[0];
  //   const eventData =
  //     packet != null
  //       ? {
  //           connectionID: this.getConnectionKey(),
  //           deviceID: this._attributes.deviceID,
  //           name: CoapMessages.getUriPath(packet).substr(3),
  //           ttl: CoapMessages.getMaxAge(packet),
  //         }
  //       : new Error();

  //   this._logger.info(eventData, `Device Event: ${  type}`);
  //   super.emit(type, ...args);
  // }

  getAttributes(): DeviceAttributes {
    return {
      ...this._attributes,
      ...this._attributesFromDevice,
    };
  }

  getStatus(): DeviceStatus {
    return this._status;
  }

  getSystemInformation(): SystemInformation {
    return nullthrows(this._systemInformation);
  }

  isFlashing(): boolean {
    return this._isFlashing;
  }

  updateAttributes(attributes: Partial<DeviceAttributes>): DeviceAttributes {
    this._attributes = {
      ...this._attributes,
      ...attributes,
      ...this._attributesFromDevice,
    };

    this._logger = Logger.createModuleLogger(module, {
      connectionKey: this._connectionKey,
      deviceID: this.getDeviceID(),
      attributes: this._attributes,
    });

    return this._attributes;
  }

  setMaxBinarySize(maxBinarySize: number) {
    this._maxBinarySize = maxBinarySize;
  }

  setOtaChunkSize(maxBinarySize: number) {
    this._otaChunkSize = maxBinarySize;
  }

  setStatus(status: DeviceStatus) {
    this._status = status;
    this._statusEventEmitter.emit(NEW_STATUS_EVENT_NAME, status);
  }

  async hasStatus(status: DeviceStatus): Promise<void> {
    if (status <= this._status) {
      return Promise.resolve();
    }

    return new Promise((resolve: () => void) => {
      const deviceStatusListener = (newStatus: DeviceStatus) => {
        if (status <= newStatus) {
          resolve();
          this._statusEventEmitter.removeListener(
            NEW_STATUS_EVENT_NAME,
            deviceStatusListener,
          );
        }
      };

      this._statusEventEmitter.on(NEW_STATUS_EVENT_NAME, deviceStatusListener);
    });
  }

  /**
   * configure our socket and start the handshake
   */
  async startProtocolInitialization(): Promise<string> {
    this._socket.setNoDelay(true);
    this._socket.setKeepAlive(true, KEEP_ALIVE_TIMEOUT); // every 15 second(s)
    this._socket.setTimeout(SOCKET_TIMEOUT);

    this._socket.on('error', (error: Error): void =>
      this.disconnect(`socket error: ${error.message}`),
    );
    this._socket.on('close', (): void => this.disconnect('socket close'));
    this._socket.on('timeout', (): void => this.disconnect('socket timeout'));

    return this.startHandshake();
  }

  async startHandshake(): Promise<string> {
    // when the handshake is done, we can expect two stream properties,
    // '_decipherStream' and '_cipherStream'
    try {
      const result = await this._handshake.start(this);

      if (!result) {
        throw new Error('Handshake result undefined');
      }

      const { cipherStream, decipherStream, deviceID, handshakeBuffer } =
        result;

      this._cipherStream = cipherStream;
      this._decipherStream = decipherStream;

      const getHelloInfo = this._getHello(handshakeBuffer);

      this.updateAttributes({
        ...(getHelloInfo || {}),
        deviceID,
        ip: this.getRemoteIPAddress(),
      });
      this.setStatus(DEVICE_STATUS_MAP.GOT_HELLO);

      return deviceID;
    } catch (error) {
      this.disconnect(error);
      throw error;
    }
  }

  async completeProtocolInitialization(): Promise<SystemInformation> {
    try {
      const decipherStream = this._decipherStream;
      if (!decipherStream) {
        throw new Error('decipherStream not set.');
      }

      decipherStream.on('readable', () => {
        const read = (): Buffer => decipherStream.read() as Buffer;

        let chunk = read();
        while (chunk !== null) {
          this._clientHasWrittenToSocket();
          this.routeMessage(chunk);
          chunk = read();
        }
        this._clientHasWrittenToSocket();
      });

      // Wait for Device to set things up
      await new Promise((resolve: (_: void) => void): void => {
        setTimeout((): void => resolve(), 100);
      });

      // Wait for this thing to be readable before sending any messages
      // await new Promise((resolve: () => void) => {
      //   decipherStream.once('readable', resolve);
      // });

      await this._sendHello();
      this._connectionStartTime = new Date();

      // Wait for Device to set things up
      await new Promise((resolve: (_: void) => void): void => {
        setTimeout((): void => resolve(), 100);
      });

      // Bake in some retries
      const { functionState, systemInformation } = await this._getDescription();
      this._systemInformation = systemInformation;

      this.updateAttributes({
        functions: nullthrows(functionState).f,
        variables: nullthrows(functionState).v,
      });

      this.setStatus(DEVICE_STATUS_MAP.GOT_DESCRIPTION);

      this._logger.info(
        {
          cache_key: this._connectionKey,
          deviceID: this.getDeviceID(),
          firmwareVersion: this._attributesFromDevice.productFirmwareVersion,
          ip: this.getRemoteIPAddress(),
          particleProductId: this._attributesFromDevice.particleProductId,
          platformId: this._attributesFromDevice.platformId,
        },
        'On device protocol initialization complete',
      );

      return systemInformation;
    } catch (error) {
      this._logger.error(
        { ...this._attributes, err: error },
        'completeProtocolInitialization',
      );
      throw error;
    }
  }

  // This handles the case on some operating systems where `socket.setTimeout`
  // doesn't work. On windows, that function will timeout when if the client
  // doesn't send a reply. On Linux as long as someone is reading or writing
  // to a socket it will stay open.
  _clientHasWrittenToSocket() {
    if (this._socketTimeoutInterval) {
      clearTimeout(this._socketTimeoutInterval);
    }
    this._socketTimeoutInterval = setTimeout(
      (): void => this.disconnect('socket timeout'),
      SOCKET_TIMEOUT,
    );
  }

  _getHello(chunk: Buffer): GetHelloInfo | null | undefined {
    const message = CoapMessages.unwrap(chunk);
    if (!message || !message.messageId) {
      throw new Error('failed to parse hello');
    }

    this._receiveCounter = message.messageId;

    try {
      const { payload } = message;
      if (!payload || payload.length <= 0) {
        return null;
      }

      this._attributesFromDevice = {
        particleProductId: payload.readUInt16BE(0),
        platformId: payload.readUInt16BE(6),
        productFirmwareVersion: payload.readUInt16BE(2),
        reservedFlags: payload.readUInt16BE(4),
      };

      this._logger.info(this._attributesFromDevice, 'Connection attributes');

      if (this._attributesFromDevice.platformId !== 0) {
        // This is the maximum for Photon/P1.
        // It should be updated for Boron and other types.
        this.setMaxBinarySize(384000);
      }

      return this._attributesFromDevice;
    } catch (error) {
      this._logger.error(
        { deviceID: this.getDeviceID(), err: error },
        'Error while parsing hello payload ',
      );
      return null;
    }
  }

  async _sendHello() {
    // client will set the counter property on the message
    this._sendCounter = CryptoManager.getRandomUINT16();
    this.sendMessage('Hello');
  }

  ping(): {
    connected: boolean;
    lastHeard: Date | null | undefined;
  } {
    if (settings.SHOW_VERBOSE_DEVICE_LOGS) {
      this._logger.info({ deviceID: this.getDeviceID() }, 'Pinged, replying');
    }

    return {
      connected: this._socket !== null,
      lastHeard: this._attributes.lastHeard,
    };
  }

  /**
   * Deals with messages coming from the device over our secure connection
   * @param data
   */
  routeMessage(data: Buffer) {
    const packet = CoapMessages.unwrap(data);

    if (!packet) {
      this._logger.error(
        {
          deviceID: this.getDeviceID(),
        },
        'RouteMessage got a NULL COAP message ',
      );
      return;
    }

    // make sure the packet always has a number for code...
    const messageCode = parseFloat(packet.code);
    packet.code = messageCode.toString();

    // Get the message code (the decimal portion of the code) to determine
    // how we should handle the message
    let requestType: string | null | undefined = '';
    if (
      messageCode > CoapMessage.Code.EMPTY &&
      messageCode <= CoapMessage.Code.DELETE
    ) {
      // probably a request
      requestType = CoapMessages.getRequestType(packet);
    }

    if (!requestType) {
      requestType = this._getResponseType(packet.token || Buffer.from([]));
    }

    // This is just a dumb ack packet. We don't really need to do anything
    // with it.
    if (packet.ack) {
      if (!requestType) {
        // no type, can't route it.
        requestType = 'PingAck';
      }

      this.emit(requestType, packet);
      return;
    }

    this._incrementReceiveCounter();
    if (packet.code === '0' && packet.confirmable) {
      this.updateAttributes({ lastHeard: new Date() });
      this.sendReply('PingAck', packet.messageId);
      return;
    }

    if (!packet || packet.messageId !== this._receiveCounter) {
      this._logger.warn(
        {
          deviceID: this.getDeviceID(),
          expect: this._receiveCounter,
          got: packet.messageId,
        },
        'MessageId other than expected',
      );

      if (requestType === 'Ignored') {
        // don't ignore an ignore...
        this.disconnect('Got an Ignore');
        return;
      }

      // this.sendMessage('Ignored', null, {}, null, null);
      this.disconnect('Bad Counter');
      return;
    }

    this.emit(requestType || '', packet);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sendReply<TType extends abstract new (...args: any) => any>(
    messageName: MessageType,
    id: number,
    data?: Buffer | null,
    token?: number | null,
    requester?: InstanceType<TType>,
  ) {
    if (!this._isSocketAvailable(requester || null, messageName)) {
      return;
    }

    // if my reply is an acknowledgement to a confirmable message
    // then I need to re-use the message id...

    // set our counter
    if (id < 0) {
      this._incrementSendCounter();
      id = this._sendCounter; // eslint-disable-line no-param-reassign
    }

    const message = CoapMessages.wrap(messageName, id, null, null, data, token);
    if (!message) {
      this._logger.error(
        {
          deviceID: this.getDeviceID(),
        },
        'Device - could not unwrap message',
      );
      return;
    }

    if (!this._cipherStream) {
      this._logger.error(
        {
          deviceID: this.getDeviceID(),
        },
        'Device - sendReply before READY',
      );
      return;
    }

    this._cipherStream.write(message);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sendMessage<TType extends abstract new (...args: any) => any>(
    messageName: MessageType,
    params?: {
      args?: Array<string> | Array<Buffer>;
      name?: string;
      event_name?: string;
    } | null,
    options?: Array<CoapOption> | null,
    data?: Buffer | null,
    requester?: InstanceType<TType>,
  ): number {
    if (!this._isSocketAvailable(requester, messageName)) {
      return -1;
    }

    // increment our counter
    this._incrementSendCounter();

    let token = null;
    if (!CoapMessages.isNonTypeMessage(messageName)) {
      this._incrementSendToken();
      this._useToken(messageName, this._sendToken);
      token = this._sendToken;
    }

    const message = CoapMessages.wrap(
      messageName,
      this._sendCounter,
      params,
      options,
      data,
      token,
    );

    if (!message) {
      this._logger.error(
        { data, deviceID: this.getDeviceID(), messageName, params },
        'Could not wrap message',
      );
      return -1;
    }

    if (!this._cipherStream) {
      this._logger.error(
        {
          deviceID: this.getDeviceID(),
          messageName,
        },
        'Client - sendMessage before READY',
      );
    }

    process.nextTick(
      (): boolean => !!this._cipherStream && this._cipherStream.write(message),
    );

    return token || 0;
  }

  // Adds a listener to our secure message stream
  async listenFor(
    eventName: MessageType,
    uri?: string | null,
    token?: number | null,
  ): Promise<CoapPacket> {
    const tokenHex = token ? Device._toHexString(token) : null;
    const beVerbose = settings.SHOW_VERBOSE_DEVICE_LOGS;

    return new Promise(
      (
        resolve: (packet: CoapPacket) => void,
        reject: (error?: Error) => void,
      ) => {
        const cleanUpListeners = () => {
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          this.removeListener(eventName, handler);
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          this.removeListener('disconnect', disconnectHandler);
        };

        const timeout = setTimeout(() => {
          cleanUpListeners();
          reject(new Error(`Request timed out ${eventName}`));
        }, KEEP_ALIVE_TIMEOUT);

        // adds a one time event
        const handler = (packet: CoapPacket) => {
          clearTimeout(timeout);
          const packetUri = CoapMessages.getUriPath(packet);
          if (uri && packetUri.indexOf(uri) !== 0) {
            if (beVerbose) {
              this._logger.warn(
                {
                  deviceID: this.getDeviceID(),
                  packetUri,
                  uri,
                },
                'URI filter did not match',
              );
            }
            reject(new Error('URI filter did not match'));
            return;
          }

          const packetTokenHex = packet.token?.toString('hex');
          if (tokenHex && tokenHex !== packetTokenHex) {
            if (beVerbose) {
              this._logger.warn(
                {
                  deviceID: this.getDeviceID(),
                  packetTokenHex,
                  tokenHex,
                },
                'Tokens did not match',
              );
            }
            reject(new Error('Tokens did not match'));
            return;
          }
          cleanUpListeners();
          resolve(packet);
        };

        const disconnectHandler = () => {
          cleanUpListeners();
          reject();
        };

        this.on(eventName, handler);
        this.on('disconnect', disconnectHandler);
      },
    );
  }

  static _increment(counter: number, maxSize: number): number {
    const resultCounter = counter + 1;
    return resultCounter < maxSize ? resultCounter : 0;
  }

  _incrementSendCounter() {
    this._sendCounter = Device._increment(this._sendCounter, COUNTER_MAX);
  }

  _incrementReceiveCounter() {
    this._receiveCounter = Device._increment(this._receiveCounter, COUNTER_MAX);
  }

  // increments or wraps our token value, and makes sure it isn't in use
  _incrementSendToken(): number {
    this._sendToken = Device._increment(this._sendToken, TOKEN_COUNTER_MAX);
    this._clearToken(this._sendToken);
    return this._sendToken;
  }

  /**
   * Associates a particular token with a message we're sending, so we know
   * what we're getting back when we get an ACK
   */
  _useToken(name: MessageType, sendToken: number) {
    const key = Device._toHexString(sendToken);

    if (this._tokens[key]) {
      throw new Error(
        `Token ${name} ${this._tokens[key]} ${key} already in use`,
      );
    }

    this._tokens[key] = name;
  }

  // clears the association with a particular token
  _clearToken(sendToken: number) {
    const key = Device._toHexString(sendToken);

    if (this._tokens[key]) {
      delete this._tokens[key];
    }
  }

  _getResponseType(token: Buffer): string | null | undefined {
    const tokenString = token.toString('hex');
    const request = this._tokens[tokenString];
    if (!request) {
      return '';
    }

    return CoapMessages.getResponseType(request);
  }

  async getVariableValue(name: string): Promise<Buffer | null | undefined> {
    const isBusy = !this._isSocketAvailable(null);
    if (isBusy) {
      throw new Error('This device is locked during the flashing process.');
    }

    await this.hasStatus(DEVICE_STATUS_MAP.READY);

    if (!this._hasParticleVariable(name)) {
      throw new Error('Variable not found');
    }

    const messageToken = this.sendMessage('VariableRequest', { name });
    const message = await this.listenFor('VariableValue', null, messageToken);

    return this._transformVariableResult(name, message);
  }

  async callFunction(
    functionName: string,
    functionArguments: Record<string, string>,
  ): Promise<string | number | boolean | Buffer | null | undefined> {
    const isBusy = !this._isSocketAvailable(null);
    if (isBusy) {
      throw new Error('This device is locked during the flashing process.');
    }

    await this.hasStatus(DEVICE_STATUS_MAP.READY);

    if (!this._hasSparkFunction(functionName)) {
      throw new Error('Function not found');
    }

    this._logger.info(
      {
        deviceID: this.getDeviceID(),
        functionName,
      },
      'sending function call to the device',
    );

    const token = this.sendMessage('FunctionCall', {
      args: Object.values(functionArguments),
      name: functionName,
    });
    const message = await this.listenFor('FunctionReturn', null, token);
    return this._transformFunctionResult(functionName, message);
  }

  /**
   * Asks the device to start or stop its 'raise your hand' signal.
   * This will turn `nyan` mode on or off which just flashes the LED a bunch of
   * colors.
   */
  async raiseYourHand(shouldShowSignal: boolean): Promise<CoapPacket> {
    const isBusy = !this._isSocketAvailable(null);
    if (isBusy) {
      throw new Error('This device is locked during the flashing process.');
    }

    /**
     * does the special URL writing needed directly to the COAP message object,
     * since the URI requires non-text values
     */
    const buffer = Buffer.alloc(1);
    buffer.writeUInt8(shouldShowSignal ? 1 : 0, 0);

    const token = this.sendMessage('SignalStart', null, [
      {
        name: CoapMessage.Option.URI_QUERY,
        value: buffer,
      },
    ]);

    return this.listenFor('SignalStartReturn', null, token);
  }

  async flash(
    binary: Buffer | null | undefined,
    fileTransferStore: FileTransferStore = FileTransferStore.FIRMWARE,
    address: string = '0x0',
  ): Promise<{
    status: string;
  }> {
    const isBusy = !this._isSocketAvailable(null);
    if (isBusy) {
      throw new Error('This device is locked during the flashing process.');
    }

    this._isFlashing = true;

    const flasher = new Flasher(this, this._maxBinarySize, this._otaChunkSize);
    try {
      this._logger.info(
        {
          deviceID: this.getDeviceID(),
        },
        'flash device started! - sending api event',
      );

      this.emit(DEVICE_EVENT_NAMES.FLASH_STARTED);

      await flasher.startFlashBuffer(binary, fileTransferStore, address);

      this._logger.info(
        {
          deviceID: this.getDeviceID(),
        },
        'Flash device finished! - sending api event',
      );

      this.emit(DEVICE_EVENT_NAMES.FLASH_SUCCESS);
      this._isFlashing = false;
      this._owningFlasher = null;

      return { status: 'Update finished' };
    } catch (error) {
      this._logger.error(
        {
          deviceID: this.getDeviceID(),
          err: error,
        },
        'Flash device failed! - sending api event',
      );

      this._isFlashing = false;

      this.emit(DEVICE_EVENT_NAMES.FLASH_FAILED);
      return { status: 'Update Failed' };
    }
  }

  _isSocketAvailable(
    requester?: unknown | null,
    messageName?: string,
  ): boolean {
    if (!this._owningFlasher || this._owningFlasher === requester) {
      return true;
    }

    this._logger.error(
      {
        cache_key: this._connectionKey,
        deviceID: this.getDeviceID(),
        messageName,
      },
      'This client has an exclusive lock',
    );

    return false;
  }

  takeOwnership(flasher: Flasher): boolean {
    if (this._owningFlasher) {
      this._logger.error(
        { deviceID: this.getDeviceID() },
        'Device already owned',
      );
      return false;
    }
    // only permit the owning object to send messages.
    this._owningFlasher = flasher;
    return true;
  }

  releaseOwnership(flasher: Flasher) {
    this._logger.info(
      { deviceID: this.getDeviceID() },
      'Releasing flash ownership',
    );
    if (this._owningFlasher === flasher) {
      this._owningFlasher = null;
    } else if (this._owningFlasher) {
      this._logger.error(
        { deviceID: this.getDeviceID(), flasher },
        "Cannot releaseOwnership, isn't  current owner",
      );
    }
  }

  _transformVariableResult(
    name: string,
    packet: CoapPacket,
  ): Buffer | null | undefined {
    // grab the variable type, if the device doesn't say, assume it's a 'string'
    const variableType =
      (this._attributes.variables && this._attributes.variables[name]) ||
      'string';

    let result: Buffer | null | undefined = null;
    try {
      if (packet.payload?.length) {
        // Leaving raw payload in response message for now, so we don't shock
        // our users.
        result = CoapMessages.fromBinary(
          packet.payload,
          variableType,
        ) as unknown as Buffer;
      }
    } catch (error) {
      this._logger.error(
        { err: error },
        '_transformVariableResult - error transforming response',
      );
    }

    return result;
  }

  // Transforms the result from a device function to the correct type.
  private _transformFunctionResult(
    name: string,
    packet: CoapPacket,
  ): string | number | boolean | Buffer | null | undefined {
    const variableType = 'int32';

    let result: string | number | boolean | Buffer | null = null;
    try {
      if (packet.payload?.length) {
        result = CoapMessages.fromBinary(packet.payload, variableType);
      }
    } catch (error) {
      this._logger.error(
        { name, err: error },
        '_transformFunctionResult - error transforming response',
      );
      throw error;
    }

    return result;
  }

  async _getDescription(): Promise<DeviceDescription> {
    return new Promise(
      (
        resolve: (deviceDescription: DeviceDescription) => void,
        reject: (error: Error) => void,
      ) => {
        let systemInformation: SystemInformation;
        let functionState: FunctionState;

        const cleanUpListeners = () => {
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          this.removeListener('DescribeReturn', handler);
          this.removeListener('disconnect', cleanUpListeners);
        };

        const timeout = setTimeout(() => {
          cleanUpListeners();
          reject(new Error('Request timed out - Describe'));
        }, KEEP_ALIVE_TIMEOUT);

        const handler = (packet: CoapPacket) => {
          // Check if it was a bad request and retry
          if (Number.parseFloat(packet.code) >= 4) {
            this._logger.error(
              {
                packet,
              },
              'Received error code for Describe message',
            );
            cleanUpListeners();
            reject(new Error('Received error code for Describe message'));
            return;
          }

          const { payload } = packet;
          if (!payload?.length) {
            this._logger.error(
              {
                packet,
              },
              'Payload empty for Describe message',
            );
            cleanUpListeners();
            reject(new Error('Payload empty for Describe message'));
            return;
          }

          const data = JSON.parse(payload.toString('utf8'));

          if (!systemInformation && data.m) {
            systemInformation = data;
          }

          if (data && data.v) {
            functionState = data;
            // 'v':{'temperature':2}
            nullthrows(functionState).v = CoapMessages.translateIntTypes(
              nullthrows(data.v),
            );
          }

          if (!systemInformation || !functionState) {
            return;
          }

          clearTimeout(timeout);
          cleanUpListeners();

          resolve({ functionState, systemInformation });
        };

        this.on('DescribeReturn', handler);
        this.on('disconnect', cleanUpListeners);

        // Because some firmware versions do not send the app + system state
        // in a single message, we cannot use `listenFor` and instead have to
        // write some hacky code that duplicates a lot of the functionality
        this.sendMessage('Describe');
      },
    );
  }

  //-------------
  // Device Events / Spark.publish / Spark.subscribe
  //-------------
  onDeviceEvent<TEventContextData>(event: ProtocolEvent<TEventContextData>) {
    this.sendDeviceEvent(event);
  }

  sendDeviceEvent<TEventContextData>(event: ProtocolEvent<TEventContextData>) {
    const { data, isPublic, name, ttl } = event;
    const messageName = isPublic
      ? DEVICE_MESSAGE_EVENTS_NAMES.PUBLIC_EVENT
      : DEVICE_MESSAGE_EVENTS_NAMES.PRIVATE_EVENT;

    this.sendMessage(
      messageName,
      {
        event_name: name,
      },
      [
        {
          name: CoapMessage.Option.MAX_AGE,
          value: CoapMessages.toBinary(ttl, 'uint32'),
        },
      ],
      (data && Buffer.from(data)) || null,
    );
  }

  _hasParticleVariable(name: string): boolean {
    return !!(this._attributes.variables && this._attributes.variables[name]);
  }

  _hasSparkFunction(functionName: string): boolean {
    return !!(
      this._attributes.functions &&
      this._attributes.functions.some(
        (fn: string): boolean =>
          fn.toLowerCase() === functionName.toLowerCase(),
      )
    );
  }

  static _toHexString(value: number): string {
    return Buffer.from([value]).toString('hex');
  }

  getDeviceID(): string {
    return this._attributes.deviceID;
  }

  getConnectionKey(): string | null | undefined {
    return this._connectionKey;
  }

  getRemoteIPAddress(): string {
    return this._socket.remoteAddress
      ? this._socket.remoteAddress.toString()
      : 'unknown';
  }

  disconnect(message: unknown | null = '') {
    this._disconnectCounter += 1;

    if (this._socketTimeoutInterval) {
      clearTimeout(this._socketTimeoutInterval);
      this._socketTimeoutInterval = undefined;
    }

    const logInfo = {
      cache_key: this._connectionKey,
      deviceID: this.getDeviceID(),
      duration: this._connectionStartTime
        ? (Date.now() - (this._connectionStartTime?.getTime() || 0)) / 1000.0
        : undefined,
    } as const;

    if (this._disconnectCounter > 1) {
      return;
    }

    try {
      this._logger.info(
        {
          ...logInfo,
          disconnectCounter: this._disconnectCounter,
          message,
        },
        'Device disconnected',
      );
    } catch (error) {
      this._logger.error(
        { deviceID: this.getDeviceID(), err: error },
        'Disconnect log error',
      );
    }

    if (this._decipherStream) {
      try {
        this._decipherStream.end();
        this._decipherStream = null;
      } catch (error) {
        this._logger.error(
          { deviceID: this.getDeviceID(), err: error },
          'Error cleaning up decipherStream',
        );
      }
    }

    if (this._cipherStream) {
      try {
        this._cipherStream.end();
        this._cipherStream = null;
      } catch (error) {
        this._logger.error(
          { deviceID: this.getDeviceID(), err: error },
          'Error cleaning up cipherStream',
        );
      }
    }

    try {
      this._socket.end();
      this._socket.destroy();
    } catch (error) {
      this._logger.error(
        { deviceID: this.getDeviceID(), err: error },
        'Disconnect TCPSocket error',
      );
    }

    this.emit(DEVICE_EVENT_NAMES.DISCONNECT, message);

    // obv, don't do this before emitting disconnect.
    try {
      this.removeAllListeners();
    } catch (error) {
      this._logger.error(
        { deviceID: this.getDeviceID(), err: error },
        'Problem removing listeners',
      );
    }
  }
}

export default Device;
