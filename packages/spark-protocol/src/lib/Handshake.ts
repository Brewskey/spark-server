import type { Socket } from 'net';
import type { Stream, Duplex } from 'stream';
import type Device from '../clients/Device';
import type DeviceKey from './DeviceKey';
import type CryptoStream from './CryptoStream';
import type CryptoManager from './CryptoManager';

import ChunkingStream from './ChunkingStream';
import Logger from './logger';
const logger = Logger.createModuleLogger(module);
/*
 Handshake protocol v1

 1) Socket opens:

 2) Server responds with 40 bytes of random data as a nonce.
 Device should read exactly 40 bytes from the socket.
 Timeout: 30 seconds.  If timeout is reached, Device must close TCP socket
 and retry the connection.

 Device appends the 12-byte STM32 Unique ID to the nonce,
 RSA encrypts the 52-byte message with the Server's public key,
 and sends the resulting 256-byte ciphertext to the Server.
 The Server's public key is stored on the external flash chip at address TBD.
 The nonce should be repeated in the same byte order it arrived (FIFO)
 and the STM32 ID should be appended in the same byte order as the memory addresses:
 0x1FFFF7E8, 0x1FFFF7E9, 0x1FFFF7EA… 0x1FFFF7F2, 0x1FFFF7F3.

 3) Server should read exactly 256 bytes from the socket.
 Timeout waiting for the encrypted message is 30 seconds.
 If the timeout is reached, Server must close the connection.

 Server RSA decrypts the message with its private key.  If the decryption fails,
 Server must close the connection.
 Decrypted message should be 52 bytes, otherwise Server must close the connection.
 The first 40 bytes of the message must match the previously sent nonce,
 otherwise Server must close the connection.
 Remaining 12 bytes of message represent STM32 ID.
 Server looks up STM32 ID, retrieving the Device's public RSA key.
 If the public key is not found, Server must close the connection.

 4) Server creates secure session key
 Server generates 40 bytes of secure random data to serve as components of a session key
 for AES-128-CBC encryption.
 The first 16 bytes (MSB first) will be the key, the next 16 bytes (MSB first)
 will be the initialization vector (IV), and the final 8 bytes (MSB first) will be the salt.
 Server RSA encrypts this 40-byte message using the Device's public key
 to create a 128-byte ciphertext.
 Server creates a 20-byte HMAC of the ciphertext using SHA1 and the 40 bytes generated
 in the previous step as the HMAC key.
 Server signs the HMAC with its RSA private key generating a 256-byte signature.
 Server sends 384 bytes to Device: the ciphertext then the signature.

 5) Release control back to the Device module
 Device creates a protobufs Hello with counter set to the uint32
 represented by the most significant 4 bytes of the IV,
 encrypts the protobufs Hello with AES, and sends the ciphertext to Server.
 Server reads protobufs Hello from socket, taking note of counter.
 Each subsequent message received from Device must have the counter incremented by 1.
 After the max uint32, the next message should set the counter to zero.

 Server creates protobufs Hello with counter set to a random uint32,
 encrypts the protobufs Hello with AES, and sends the ciphertext to Device.
 Device reads protobufs Hello from socket, taking note of counter.
 Each subsequent message received from Server must have the counter incremented by 1.
 After the max uint32, the next message should set the counter to zero.
*/

const NONCE_BYTES = 40;
const ID_BYTES = 12;
const SESSION_BYTES = 40;
const GLOBAL_TIMEOUT = 10;
const DECIPHER_STREAM_TIMEOUT = 30;

type HandshakeResult = {
  cipherStream: CryptoStream;
  decipherStream: CryptoStream;
  deviceID: string;
  handshakeBuffer: Buffer;
};

class Handshake {
  _device!: Device;

  _cryptoManager: CryptoManager;

  _socket!: Socket;

  _deviceID!: string;

  _useChunkingStream: boolean = true;

  _allowDeviceToProvidePem: boolean = false;

  constructor(cryptoManager: CryptoManager, allowDeviceToProvidePem: boolean) {
    this._cryptoManager = cryptoManager;
    this._allowDeviceToProvidePem = allowDeviceToProvidePem;
  }

  async start(device: Device): Promise<HandshakeResult> {
    this._device = device;
    this._socket = device._socket;

    return Promise.race([
      this._runHandshake(),
      this._startGlobalTimeout<HandshakeResult>(),
    ]).catch((error: Error) => {
      const logInfo = {
        cache_key: this._device && this._device._connectionKey,
        deviceID: this._deviceID || null,
        ip:
          this._socket && this._socket.remoteAddress
            ? this._socket.remoteAddress.toString()
            : 'unknown',
      } as const;

      logger.error({ ...logInfo, err: error }, 'Handshake failed');

      throw error;
    });
  }

  async _runHandshake(): Promise<HandshakeResult> {
    const nonce = await this._sendNonce();
    const data = await this._onSocketDataAvailable();
    const { deviceID, deviceProvidedPem } = await this._readDeviceHandshakeData(
      nonce,
      data,
    );
    this._deviceID = deviceID;
    const publicKey = await this._getDevicePublicKey(
      deviceID,
      deviceProvidedPem,
    );

    const { cipherStream, decipherStream } =
      await this._sendSessionKey(publicKey);

    const handshakeBuffer = await Promise.race([
      this._onDecipherStreamReadable(decipherStream),
      this._onDecipherStreamTimeout(),
    ]);

    if (!handshakeBuffer) {
      throw new Error('wrong device public keys');
    }

    return {
      cipherStream,
      decipherStream,
      deviceID,
      handshakeBuffer,
    };
  }

  async _startGlobalTimeout<TResult>(): Promise<TResult> {
    return new Promise(
      (_: (result: TResult) => void, reject: (error: Error) => void) => {
        setTimeout(
          (): void =>
            reject(
              new Error(
                `Handshake did not complete in ${GLOBAL_TIMEOUT} seconds`,
              ),
            ),
          GLOBAL_TIMEOUT * 1000,
        );
      },
    );
  }

  async _onSocketDataAvailable(): Promise<Buffer> {
    return new Promise(
      (resolve: (data: Buffer) => void, reject: (error: unknown) => void) => {
        const onReadable = () => {
          try {
            const data = this._socket.read() as Buffer;

            if (!data) {
              logger.error('onSocketData called, but no data sent.');
              reject(new Error('onSocketData called, but no data sent.'));
            }

            resolve(data);
          } catch (error) {
            logger.error(
              { err: error },
              'Handshake: Exception thrown while processing data',
            );
            reject(error);
          }

          this._socket.removeListener('readable', onReadable);
        };
        this._socket.on('readable', onReadable);
      },
    );
  }

  async _sendNonce(): Promise<Buffer> {
    const nonce = await this._cryptoManager.getRandomBytes(NONCE_BYTES);
    this._socket.write(nonce);

    return nonce;
  }

  async _readDeviceHandshakeData(
    nonce: Buffer,
    data: Buffer,
  ): Promise<{
    deviceID: string;
    deviceProvidedPem: string | null | undefined;
  }> {
    const decryptedHandshakeData = this._cryptoManager.decrypt(data);

    if (!decryptedHandshakeData) {
      throw new Error(
        'handshake data decryption failed. ' +
          'You probably have incorrect server key for device',
      );
    }

    if (decryptedHandshakeData.length < NONCE_BYTES + ID_BYTES) {
      throw new Error(
        `handshake data was too small: ${decryptedHandshakeData.length}`,
      );
    }

    const nonceBuffer = Buffer.alloc(NONCE_BYTES);
    const deviceIDBuffer = Buffer.alloc(ID_BYTES);
    const deviceKeyBuffer = Buffer.alloc(
      decryptedHandshakeData.length - (NONCE_BYTES + ID_BYTES),
    );

    decryptedHandshakeData.copy(nonceBuffer, 0, 0, NONCE_BYTES);
    decryptedHandshakeData.copy(
      deviceIDBuffer,
      0,
      NONCE_BYTES,
      NONCE_BYTES + ID_BYTES,
    );
    decryptedHandshakeData.copy(
      deviceKeyBuffer,
      0,
      NONCE_BYTES + ID_BYTES,
      decryptedHandshakeData.length,
    );

    if (!nonceBuffer.equals(nonce)) {
      throw new Error('nonces didn`t match');
    }

    const deviceProvidedPem = this._convertDERtoPEM(deviceKeyBuffer);
    const deviceID = deviceIDBuffer.toString('hex');

    return { deviceID, deviceProvidedPem };
  }

  /**
 * base64 encodes raw binary into
 * "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDHzg9dPG03Kv4NkS3N0xJfU8lT1M+s9HTs75
    DE1tpwXfU4GkfaLLr04j6jFpMeeggKCgWJsKyIAR9CNlVHC1IUYeejEJQCe6JReTQlq9F6bioK
    84nc9QsFTpiCIqeTAZE4t6Di5pF8qrUgQvREHrl4Nw0DR7ECODgxc/r5+XFh9wIDAQAB"
 * then formats into PEM format:
 *
 * //-----BEGIN PUBLIC KEY-----
 * //MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDHzg9dPG03Kv4NkS3N0xJfU8lT
 * //1M+s9HTs75DE1tpwXfU4GkfaLLr04j6jFpMeeggKCgWJsKyIAR9CNlVHC1IUYeej
 * //EJQCe6JReTQlq9F6bioK84nc9QsFTpiCIqeTAZE4t6Di5pF8qrUgQvREHrl4Nw0D
 * //R7ECODgxc/r5+XFh9wIDAQAB
 * //-----END PUBLIC KEY-----
 */
  _convertDERtoPEM(buffer?: Buffer | null): string | null | undefined {
    if (!buffer || !buffer.length) {
      return null;
    }

    const bufferString = buffer.toString('base64');
    try {
      const lines = [
        '-----BEGIN PUBLIC KEY-----',
        ...(bufferString.match(/.{1,64}/g) || []),
        '-----END PUBLIC KEY-----',
      ];
      return lines.join('\n');
    } catch (error) {
      logger.error({ bufferString, err: error }, 'error converting DER to PEM');
    }
    return null;
  }

  async _getDevicePublicKey(
    deviceID: string,
    deviceProvidedPem?: string | null,
  ): Promise<DeviceKey> {
    let publicKey = await this._cryptoManager.getDevicePublicKey(deviceID);

    if (deviceProvidedPem && this._allowDeviceToProvidePem) {
      publicKey = await this._cryptoManager.createDevicePublicKey(
        deviceID,
        deviceProvidedPem,
      );
    }

    if (!publicKey) {
      throw new Error(`no public key found for device: ${deviceID}`);
    }

    if (!publicKey.equals(deviceProvidedPem)) {
      throw new Error(
        "key passed to device during handshake doesn't" +
          `match saved public key: ${deviceID}`,
      );
    }

    return publicKey;
  }

  async _sendSessionKey(devicePublicKey: DeviceKey): Promise<{
    cipherStream: CryptoStream;
    decipherStream: CryptoStream;
  }> {
    const sessionKey = await this._cryptoManager.getRandomBytes(SESSION_BYTES);

    // Server RSA encrypts this 40-byte message using the Device's public key to
    // create a 128-byte ciphertext.
    const ciphertext = devicePublicKey.encrypt(sessionKey);

    // Server creates a 20-byte HMAC of the ciphertext using SHA1 and the 40
    // bytes generated in the previous step as the HMAC key.
    const hash = this._cryptoManager.createHmacDigest(ciphertext, sessionKey);

    // Server signs the HMAC with its RSA private key generating a 256-byte
    // signature.
    const signedhmac = await this._cryptoManager.sign(hash);

    // Server sends ~384 bytes to Device: the ciphertext then the signature.
    const message = Buffer.concat(
      [ciphertext, signedhmac],
      ciphertext.length + signedhmac.length,
    );

    const addErrorCallback = (stream: Stream, streamName: string) => {
      stream.on('error', (error: Error) => {
        logger.error(
          { deviceID: this._deviceID, err: error },
          `Error in ${streamName} stream`,
        );
      });
    };

    const decipherStream = this._cryptoManager.createAESDecipherStream(
      sessionKey,
      () => this._deviceID,
    );
    const cipherStream = this._cryptoManager.createAESCipherStream(
      sessionKey,
      () => this._deviceID,
    );

    addErrorCallback(decipherStream, 'decipher');
    addErrorCallback(cipherStream, 'cipher');

    if (this._useChunkingStream) {
      const chunkingIn = new ChunkingStream({ outgoing: false });
      const chunkingOut = new ChunkingStream({ outgoing: true });
      addErrorCallback(chunkingIn, 'chunkingIn');
      addErrorCallback(chunkingOut, 'chunkingOut');

      // What I receive gets broken into message chunks, and goes into the
      // decrypter
      this._socket.pipe(chunkingIn);
      chunkingIn.pipe(decipherStream);

      // What I send goes into the encrypter, and then gets broken into message
      // chunks
      cipherStream.pipe(chunkingOut);
      chunkingOut.pipe(this._socket);
    } else {
      this._socket.pipe(decipherStream);
      cipherStream.pipe(this._socket);
    }

    this._socket.write(message);

    return { cipherStream, decipherStream };
  }

  async _onDecipherStreamReadable(decipherStream: Duplex): Promise<Buffer> {
    return new Promise((resolve: (chunk: Buffer) => void) => {
      const callback = () => {
        const chunk = decipherStream.read() as Buffer;
        resolve(chunk);
        decipherStream.removeListener('readable', callback);
      };
      decipherStream.on('readable', callback);
    });
  }

  async _onDecipherStreamTimeout() {
    await new Promise((resolve: (_: void) => void, reject: () => void) => {
      setTimeout((): void => reject(), DECIPHER_STREAM_TIMEOUT * 1000);
    });
  }
}

export default Handshake;
