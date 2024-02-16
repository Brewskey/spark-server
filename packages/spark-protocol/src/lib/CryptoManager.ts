import crypto from 'crypto';
import NodeRSA from 'node-rsa';
import type { IDeviceKeyRepository, ServerKeyRepository } from '../types';

import CryptoStream from './CryptoStream';
import DeviceKey from './DeviceKey';

const HASH_TYPE = 'sha1';

class CryptoManager {
  _deviceKeyRepository: IDeviceKeyRepository;

  _serverKeyRepository: ServerKeyRepository;

  _serverPrivateKey!: NodeRSA;

  _serverKeyPassword: string | null | undefined;

  constructor(
    deviceKeyRepository: IDeviceKeyRepository,
    serverKeyRepository: ServerKeyRepository,
    serverKeyPassword?: string | null,
  ) {
    this._deviceKeyRepository = deviceKeyRepository;
    this._serverKeyRepository = serverKeyRepository;
    this._serverKeyPassword = serverKeyPassword;

    (async () => {
      this._serverPrivateKey = await this._getServerPrivateKey();
    })();
  }

  _createCryptoStream(
    sessionKey: Buffer,
    encrypt: boolean,
    getDeviceId: () => string,
  ): CryptoStream {
    // The first 16 bytes (MSB first) will be the key,
    // the next 16 bytes (MSB first) will be the initialization vector (IV),
    // and the final 8 bytes (MSB first) will be the salt.

    const key = Buffer.alloc(16); // just the key... +8); //key plus salt
    const iv = Buffer.alloc(16); // initialization vector

    sessionKey.copy(key, 0, 0, 16); // copy the key
    sessionKey.copy(iv, 0, 16, 32); // copy the iv

    return new CryptoStream({
      iv,
      key,
      streamType: encrypt ? 'encrypt' : 'decrypt',
      getDeviceId,
    });
  }

  async _createServerKeys(): Promise<NodeRSA> {
    const privateKey = new NodeRSA({ b: 2048 });

    await this._serverKeyRepository.createKeys(
      Buffer.from(privateKey.exportKey('pkcs1-private-pem')),
      Buffer.from(privateKey.exportKey('pkcs8-public-pem')),
    );

    return privateKey;
  }

  async _getServerPrivateKey(): Promise<NodeRSA> {
    const privateKeyString = await this._serverKeyRepository.getPrivateKey();

    if (!privateKeyString) {
      return this._createServerKeys();
    }

    return new NodeRSA(privateKeyString, undefined, {
      encryptionScheme: 'pkcs1',
      signingScheme: 'pkcs1',
    });
  }

  createAESCipherStream(
    sessionKey: Buffer,
    getDeviceId: () => string,
  ): CryptoStream {
    return this._createCryptoStream(sessionKey, true, getDeviceId);
  }

  createAESDecipherStream(
    sessionKey: Buffer,
    getDeviceId: () => string,
  ): CryptoStream {
    return this._createCryptoStream(sessionKey, false, getDeviceId);
  }

  createHmacDigest(ciphertext: Buffer, sessionKey: Buffer): Buffer {
    const hmac = crypto.createHmac(HASH_TYPE, sessionKey);
    hmac.update(ciphertext);
    return hmac.digest();
  }

  async createDevicePublicKey(
    deviceID: string,
    publicKeyPem: string,
  ): Promise<DeviceKey> {
    const output = new DeviceKey(publicKeyPem);
    await this._deviceKeyRepository.updateByID(deviceID, {
      deviceID,
      key: publicKeyPem,
    });

    return output;
  }

  decrypt(data: Buffer): Buffer | null | undefined {
    try {
      return this._serverPrivateKey.decrypt(data);
    } catch (error) {
      return null;
    }
  }

  async getDevicePublicKey(
    deviceID: string,
  ): Promise<DeviceKey | null | undefined> {
    const publicKeyObject = await this._deviceKeyRepository.getByID(deviceID);
    if (!publicKeyObject) {
      return null;
    }

    return new DeviceKey(publicKeyObject.key);
  }

  getRandomBytes(size: number): Promise<Buffer> {
    return new Promise(
      (resolve: (buffer: Buffer) => void, reject: (error: Error) => void) => {
        crypto.randomBytes(
          size,
          (error: Error | null | undefined, buffer: Buffer) => {
            if (error) {
              reject(error);
              return;
            }

            resolve(buffer);
          },
        );
      },
    );
  }

  static getRandomUINT16(): number {
    // ** - the same as Math.pow()
    const uintMax = 2 ** 16 - 1; // 65535
    return Math.floor(Math.random() * uintMax + 1);
  }

  async sign(hash: Buffer): Promise<Buffer> {
    return this._serverPrivateKey.encryptPrivate(hash);
  }
}

export default CryptoManager;
