import CoapPacket, { ParsedPacket } from 'coap-packet';
import EventEmitter from 'events';
import fs from 'fs';
import { Socket } from 'net';
import NodeRSA from 'node-rsa';
import path from 'path';

import ChunkingStream from '../lib/ChunkingStream';
import CoapUriType from '../lib/CoapUriType';
import CryptoManager from '../lib/CryptoManager';
import CryptoStream from '../lib/CryptoStream';
import NetworkThrottleStream from '../lib/NetworkThrottleStream';
import testWebhook from '../test-webhook.json';

const DEVICE_KEY_LENGTH = 12;
const COUNTER_MAX = 65536;
const RESPONSE_TIMEOUT = 10000;

// TODO - Fill in real values here. We can just use whatever is in the photon.
const PRODUCT_ID = 0;
const PRODUCT_FIRMWARE_VERSION = 0;
const PLATFORM_ID = 0;
const COAP_VERSION = 1;

const DESCRIBE_APPLICATION = 1 << 1;
const DESCRIBE_SYSTEM = 1 << 0;
const DESCRIBE_ALL = DESCRIBE_APPLICATION | DESCRIBE_SYSTEM;

type DeviceState = 'next' | 'nonce' | 'set-session-key';

type TCPDeviceOptions = {
  deviceID: string | null | undefined;
  networkDelay: number;
  serverAddress: string;
};

class TCPDevice {
  _cipherStream!: CryptoStream;
  _decipherStream!: CryptoStream;
  _deviceID: Buffer;
  _eventEmitter: EventEmitter = new EventEmitter();
  _helloTimeout: NodeJS.Timeout | null = null;
  _isConnected: boolean = false;
  _isConnecting: boolean = false;
  _messageID: number = 0;
  _networkDelay: number;
  _pingInterval: NodeJS.Timeout | null = null;
  _port: number;
  _privateKey: NodeRSA;
  _serverAddress: string;
  _serverKey: NodeRSA;
  _socket!: Socket;
  _state: DeviceState;
  _token!: Buffer;

  constructor({ deviceID, networkDelay, serverAddress }: TCPDeviceOptions) {
    this._state = 'nonce';
    this._port = 5683;
    this._networkDelay = networkDelay;
    this._serverAddress = serverAddress;
    this._serverKey = CryptoManager.getServerKey();

    const index = serverAddress.indexOf('://');
    if (index >= 0) {
      this._serverAddress = serverAddress.substr(index + 3);
    }

    if (!deviceID) {
      // Generate random device key
      deviceID = CryptoManager.randomBytes(DEVICE_KEY_LENGTH)
        .toString('hex')
        .toLowerCase();
      const privateKey = CryptoManager.createKey();
      fs.writeFileSync(
        path.join(process.cwd(), `data/keys/${deviceID}.pem`),
        privateKey.exportKey('pkcs1-private-pem'),
      );
    }

    this._privateKey = CryptoManager.loadPrivateKey(
      fs.readFileSync(
        path.join(process.cwd(), `data/keys/${deviceID}.pem`),
        'utf8',
      ),
    );
    this._deviceID = Buffer.from(deviceID, 'hex');
  }

  connect(): void {
    if (this._isConnecting) {
      return;
    }
    this._isConnecting = true;
    this._socket = new Socket();

    this._socket.connect({
      host: this._serverAddress,
      port: this._port,
    });
    this._socket.setTimeout(31000);

    this._socket.on('data', this._onReadData);

    this._socket.on('error', (error: Error) => this._reconnect(error));
    this._socket.on('close', () => this._reconnect(new Error('Socket close')));
    this._socket.on('timeout', () =>
      this._reconnect(new Error('Socket timeout')),
    );
  }

  getDeviceID(): string {
    return this._deviceID.toString('hex').toLowerCase();
  }

  getPublicKey(): string {
    return this._privateKey.exportKey('pkcs8-public-pem');
  }

  getIsConnected(): boolean {
    return this._isConnected;
  }

  sendWebhook = (): void => {
    this._sendEvent(
      testWebhook.event,
      Buffer.from(`{"payload": "${Math.random()}"}`),
    );
  };

  on = <TValue>(event: string, callback: (arg1: TValue) => void) =>
    this._eventEmitter.on(event, callback);

  removeEventListener = <TValue>(
    event: string,
    callback: (arg1: TValue) => void,
  ) => this._eventEmitter.removeListener(event, callback);

  disconnect = (): void => {
    this._disconnect();
    this._isConnected = false;
  };

  _disconnect = (): void => {
    if (!this._isConnected) {
      return;
    }

    this._isConnecting = false;
    this._isConnected = false;
    this._state = 'nonce';
    if (this._decipherStream) {
      this._decipherStream.removeAllListeners();
    }

    this._socket.removeAllListeners();
    if (!this._socket.destroyed) {
      this._socket.destroy();
      this._socket.on('error', () => {});
    }

    if (this._pingInterval) {
      clearInterval(this._pingInterval);
      this._pingInterval = null;
    }
  };

  _reconnect = (error: Error): void => {
    if (error) {
      console.error(error);
    }
    if (!this._isConnected) {
      return;
    }

    this._disconnect();
    setTimeout(() => this.connect(), 15000);
  };

  _sleep = async (time = 100): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, time));

  _onReadData = async (data: Buffer): Promise<void> => {
    await this._sleep();
    switch (this._state) {
      case 'nonce': {
        const payload = this._prepareDevicePublicKey(data);
        if (!this._socket.destroyed) {
          this._socket.write(this._serverKey.encrypt(payload));
        }
        this._state = 'set-session-key';
        break;
      }

      case 'set-session-key': {
        const cipherText = data.slice(0, 128);
        const signedHMAC = data.slice(128);

        const sessionKey = this._privateKey.decrypt(cipherText);
        // Server creates a 20-byte HMAC of the ciphertext using SHA1 and the 40
        // bytes generated in the previous step as the HMAC key.
        const hash = CryptoManager.createHmacDigest(cipherText, sessionKey);

        const decryptedHMAC = this._serverKey.decryptPublic(signedHMAC);

        if (hash.compare(decryptedHMAC) === -1) {
          throw new Error('HMAC did not match');
        }

        // The random session key has everything we need to create the crypto
        // streams
        const key = sessionKey.slice(0, 16);
        const iv = sessionKey.slice(16, 32);
        const salt = sessionKey.slice(32); // not sure what this is for...

        this._messageID = (sessionKey[32] << 8) | sessionKey[33];
        this._token = sessionKey.slice(34);

        // Create the crypto streams
        this._decipherStream = new CryptoStream({
          iv,
          key,
          streamType: 'decrypt',
        });
        this._cipherStream = new CryptoStream({
          iv,
          key,
          streamType: 'encrypt',
        });

        const chunkingIn = new ChunkingStream({ outgoing: false });
        const chunkingOut = new ChunkingStream({ outgoing: true });

        const inputDelayStream = new NetworkThrottleStream(this._networkDelay);
        const outputDelayStream = new NetworkThrottleStream(this._networkDelay);

        // What I receive gets broken into message chunks, and goes into the
        // decrypter
        this._socket
          .pipe(inputDelayStream)
          .pipe(chunkingIn)
          .pipe(this._decipherStream);

        // What I send goes into the encrypter, and then gets broken into message
        // chunks
        this._cipherStream
          .pipe(outputDelayStream)
          .pipe(chunkingOut)
          .pipe(this._socket);

        this._socket.removeListener('data', this._onReadData);
        this._decipherStream.on('data', this._onNewCoapMessage);

        this._sendHello();

        this._helloTimeout = setTimeout(() => {
          throw new Error('Did not get hello response in 2 seconds');
        }, 3000);

        this._state = 'next';

        // Ping every 10 seconds
        this._pingInterval = setInterval(() => this._pingServer(), 15000);
        this._isConnected = true;

        break;
      }

      default: {
        console.log('do the next thing', data);
      }
    }
  };

  _onNewCoapMessage = async (data: Buffer): Promise<void> => {
    const packet = CoapPacket.parse(data);
    if (packet.code === '0.00' && packet.ack) {
      this._eventEmitter.emit('ACK', packet);
    }

    const uriOption = packet.options.find(
      (option) => option.name === 'Uri-Path',
    );
    if (!uriOption) {
      return;
    }
    const path = uriOption.value.toString('utf8');
    const messageType = path.substring(0, path.indexOf('/')) || path;
    const payload = packet.payload;
    switch (messageType) {
      case CoapUriType.Describe: {
        let descriptionFlags = DESCRIBE_ALL;
        if (payload.length > 8 && payload[8] <= DESCRIBE_ALL) {
          descriptionFlags = payload[8];
        } else if (payload.length > 8) {
          console.error(`Invalid DESCRIBE flags ${payload[8]}`);
        }

        this._sendDescribe(descriptionFlags, packet);

        // Fully set up - we can register webhooks
        await this._subscribeWebhooks();

        break;
      }

      case CoapUriType.Function: {
        this._sendFunctionResult(packet);
        break;
      }

      case CoapUriType.Hello: {
        // spark-server says hi
        if (this._helloTimeout) {
          clearTimeout(this._helloTimeout);
        }
        this._helloTimeout = null;
        break;
      }

      case CoapUriType.PrivateEvent:
      case CoapUriType.PublicEvent: {
        const uris = packet.options
          .filter((o) => o.name === 'Uri-Path')
          .map((o) => o.value.toString('utf8'));
        uris.shift(); // Remove E or e
        uris.pop(); // Remove index of the packet 0-X in the data buffer
        this._eventEmitter.emit(uris.join('/'), packet);
        break;
      }

      case CoapUriType.Variable: {
        this._sendVariable(packet);
        break;
      }

      default: {
        console.warn(`Coap URI ${path} is not supported: ${packet}`);
      }
    }
  };

  _prepareDevicePublicKey(nonce: Buffer): Buffer {
    // Concat a bunch of data that we will send over encrypted with the
    // server public key.
    return Buffer.concat([
      nonce,
      this._deviceID,
      this._privateKey.exportKey('pkcs8-public-der'),
    ]);
  }

  _nextMessageID(): number {
    this._messageID += 1;
    if (this._messageID >= COUNTER_MAX) {
      this._messageID = 0;
    }

    return this._messageID;
  }

  _coapMessageHeader(type: number, tokenLength: number) {
    return (COAP_VERSION << 6) | (type << 4) | (tokenLength & 0xf);
  }

  _sendHello(): void {
    const data = [
      PRODUCT_ID >> 8,
      PRODUCT_ID & 0xff,
      PRODUCT_FIRMWARE_VERSION >> 8,
      PRODUCT_FIRMWARE_VERSION & 0xff,
      0, // Reserved flag
      0, // Flags -- newly upgraded. We probably won't use this
      PLATFORM_ID >> 8,
      PLATFORM_ID & 0xff,
      this._deviceID.length >> 8,
      this._deviceID.length & 0xff,
    ];
    this._deviceID.forEach((bit) => data.push(bit));

    const packet = CoapPacket.generate({
      code: 'POST',
      messageId: this._nextMessageID(),
      options: [
        {
          name: 'Uri-Path',
          value: Buffer.from('h'),
        },
      ],
      payload: Buffer.from(data),
    });

    this._writeData(packet);
  }

  _sendDescribe(descriptionFlags: number, serverPacket: ParsedPacket): void {
    // TODO: make this a bit more fancy

    const description = JSON.stringify({
      f: ['testfn'],
      v: { testVar: 'INT' },
      // Copypasta'd from a real device
      p: 6,
      m: [
        { s: 16384, l: 'm', vc: 30, vv: 30, f: 'b', n: '0', v: 11, d: [] },
        { s: 262144, l: 'm', vc: 30, vv: 30, f: 's', n: '1', v: 105, d: [] },
        {
          s: 262144,
          l: 'm',
          vc: 30,
          vv: 30,
          f: 's',
          n: '2',
          v: 105,
          d: [{ f: 's', n: '1', v: 105, _: '' }],
        },
        {
          s: 131072,
          l: 'm',
          vc: 30,
          vv: 30,
          u: '2BA4E71E840F596B812003882AAE7CA6496F1590CA4A049310AF76EAF11C943A',
          f: 'u',
          n: '1',
          v: 2,
          d: [{ f: 's', n: '2', v: 1, _: '' }],
        },
        { s: 131072, l: 'f', vc: 30, vv: 0, d: [] },
      ],
    });

    const packet = CoapPacket.generate({
      code: '2.05', // Content
      messageId: this._nextMessageID(),
      payload: Buffer.from(description),
      token: serverPacket.token,
    });

    this._writeData(packet);
  }

  _pingServer(): void {
    if (!this._isConnected) {
      return;
    }

    const packet = CoapPacket.generate({
      code: '0',
      confirmable: true,
      messageId: this._nextMessageID(),
    });

    this._writeData(packet);
  }

  _sendFunctionResult(serverPacket: ParsedPacket): void {
    if (!this._isConnected) {
      return;
    }

    const returnValue = Math.ceil(Math.random() * 100000); // Success!

    const packet = CoapPacket.generate({
      code: '2.04',
      messageId: this._nextMessageID(),
      token: serverPacket.token,
      payload: Buffer.from([
        returnValue >> 24,
        (returnValue >> 16) & 0xff,
        (returnValue >> 8) & 0xff,
        returnValue & 0xff,
      ]),
    });

    this._writeData(packet);
  }

  _sendVariable(serverPacket: ParsedPacket): void {
    if (!this._isConnected) {
      return;
    }

    const returnValue = 1; // Success!

    const result = Math.ceil(Math.random() * 100000);
    const packet = CoapPacket.generate({
      code: '2.05',
      messageId: this._nextMessageID(),
      token: serverPacket.token,
      payload: Buffer.from([
        result >> 24,
        (result >> 16) & 0xff,
        (result >> 8) & 0xff,
        result & 0xff,
      ]),
    });

    this._writeData(packet);
  }

  _subscribeWebhooks = async (): Promise<void> => {
    await this._subscribe(
      `hook-response/test-webhook/${this.getDeviceID()}`,
      (packet: ParsedPacket) => {},
    );
  };

  _subscribe = async (
    eventName: string,
    callback: (packet: ParsedPacket) => void,
  ): Promise<void> => {
    if (!this._isConnected) {
      return;
    }

    this._eventEmitter.on(eventName, callback);

    const messageID = this._nextMessageID();
    const packet = CoapPacket.generate({
      code: 'GET',
      confirmable: true,
      messageId: messageID,
      options: [
        {
          name: 'Uri-Path',
          value: Buffer.from(`e/${eventName}`),
        },
      ],
    });

    this._writeData(packet);
    try {
      await this._waitForResponse('ACK');
    } catch (error: any) {
      console.log(`No ACK for ${eventName}`);
    }
  };

  _sendEvent(eventName: string, payload: Buffer): void {
    if (!this._isConnected) {
      return;
    }

    const packet = CoapPacket.generate({
      code: 'POST',
      confirmable: true,
      messageId: this._nextMessageID(),
      options: [
        {
          name: 'Uri-Path',
          value: Buffer.from(`e/${eventName}`),
        },
      ],
      payload,
    });

    this._writeData(packet);
  }

  _waitForResponse = async (
    event: string,
    messageID?: number,
  ): Promise<ParsedPacket> => {
    messageID = messageID || this._messageID;
    return new Promise(
      (resolve: (packet: ParsedPacket) => void, reject: () => void) => {
        let timeout = setTimeout(() => reject(), RESPONSE_TIMEOUT);
        const handler = (packet: ParsedPacket) => {
          if (packet.messageId === messageID) {
            if (timeout) {
              clearTimeout(timeout);
            }
            this._eventEmitter.removeListener(event, handler);
            resolve(packet);
          }
        };
        this._eventEmitter.on(event, handler);
      },
    );
  };

  _writeData = (packet: any): void => {
    try {
      !this._socket.destroyed && this._cipherStream.write(packet);
    } catch (ignore: any) {}
  };
}

export default TCPDevice;
