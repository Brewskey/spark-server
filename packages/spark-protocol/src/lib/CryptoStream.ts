import { Transform, TransformCallback } from 'stream';
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

  _transform(
    chunk: Buffer | string,
    encoding: BufferEncoding,
    callback: TransformCallback,
  ) {
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

    const data = chunk as Buffer;
    try {
      const cipherParams: [string, crypto.CipherKey, crypto.BinaryLike] = [
        settings.CRYPTO_ALGORITHM,
        this._key,
        this._iv,
      ];

      let output: Buffer;

      if (this._streamType === 'encrypt') {
        const cipher = crypto.createCipheriv(...cipherParams);
        const transformedData = cipher.update(data);
        const extraData = cipher.final();
        output = Buffer.concat(
          [transformedData, extraData],
          transformedData.length + extraData.length,
        );
      } else {
        const decodeCbcChunk = (autoPad: boolean): Buffer => {
          const d = crypto.createDecipheriv(...cipherParams);
          d.setAutoPadding(autoPad);
          return Buffer.concat([d.update(data), d.final()]);
        };

        try {
          output = decodeCbcChunk(true);
        } catch (e) {
          if (
            e &&
            typeof e === 'object' &&
            'code' in e &&
            (e as NodeJS.ErrnoException).code === 'ERR_OSSL_BAD_DECRYPT'
          ) {
            output = decodeCbcChunk(false);
          } else {
            throw e;
          }
        }
      }

      const ivContainer = this._streamType === 'encrypt' ? output : data;
      this._iv = Buffer.alloc(16);
      ivContainer.copy(this._iv, 0, 0, 16);

      this.push(output);
      callback();
    } catch (error) {
      logger.error(
        {
          chunkLength: Buffer.isBuffer(chunk)
            ? chunk.length
            : String(chunk).length,
          streamType: this._streamType,
          encoding,
          deviceId: this._getDeviceId(),
          err: error,
        },
        'CryptoStream transform error',
      );
      callback(error as Error);
    }
  }
}

export default CryptoStream;
