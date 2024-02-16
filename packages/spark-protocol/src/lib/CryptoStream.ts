import { Transform } from 'stream';
import crypto from 'crypto';
import settings from '../settings';
import Logger from './logger';

const logger = Logger.createModuleLogger(module);

export type CryptoStreamType = 'decrypt' | 'encrypt';

type CryptoStreamOptions = {
  iv: Buffer;
  key: Buffer;
  streamType: CryptoStreamType;
  getDeviceId: () => string;
};

class CryptoStream extends Transform {
  _key: Buffer;

  _iv: Buffer;

  _streamType: CryptoStreamType;

  _getDeviceId: () => string;

  constructor(options: CryptoStreamOptions) {
    super();

    this._key = options.key;
    this._iv = options.iv;
    this._streamType = options.streamType;
    this._getDeviceId = options.getDeviceId;
  }

  _transform(chunk: Buffer | string, encoding: string, callback: () => void) {
    if (!chunk.length) {
      logger.error({
        encoding,
        err: new Error(
          "CryptoStream transform error: Chunk didn't have any length",
        ),
      });
      callback();
      return;
    }

    try {
      const data = chunk as Buffer;
      const cipherParams: [string, crypto.CipherKey, crypto.BinaryLike] = [
        settings.CRYPTO_ALGORITHM,
        this._key,
        this._iv,
      ];
      const cipher =
        this._streamType === 'encrypt'
          ? crypto.createCipheriv(...cipherParams)
          : crypto.createDecipheriv(...cipherParams);

      const transformedData = cipher.update(data);
      const extraData = cipher.final();
      const output = Buffer.concat(
        [transformedData, extraData],
        transformedData.length + extraData.length,
      );

      const ivContainer = this._streamType === 'encrypt' ? output : data;
      this._iv = Buffer.alloc(16);
      ivContainer.copy(this._iv, 0, 0, 16);

      this.push(output);
    } catch (error) {
      logger.error(
        {
          chunk,
          key: this._key,
          iv: this._iv,
          streamType: this._streamType,
          encoding,
          deviceId: this._getDeviceId(),
          err: error,
        },
        'CryptoStream transform error',
      );
    }
    callback();
  }
}

export default CryptoStream;
