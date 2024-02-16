import { Transform } from 'stream';
import Logger from './logger';
const logger = Logger.createModuleLogger(module);

/**
 Our job here is to accept messages in whole chunks, and put their length in front
 as we send them out, and parse them back into those size chunks as we read them in.
 * */
/* eslint-disable no-bitwise */

const MSG_LENGTH_BYTES = 2;
const messageLengthBytes = (
  message: Buffer | string,
): Buffer | null | undefined => {
  // assuming a maximum encrypted message length of 65K, lets write an
  // unsigned short int before every message, so we know how much to read out.
  const { length } = message;
  const lengthBuffer = Buffer.alloc(MSG_LENGTH_BYTES);

  lengthBuffer[0] = length >>> 8;
  lengthBuffer[1] = length & 255;

  return lengthBuffer;
};

type ChunkingStreamOptions = {
  outgoing?: boolean;
};

class ChunkingStream extends Transform {
  _combinedBuffer: Buffer | null | undefined = null;

  _currentOffset: number = 0;

  _options: ChunkingStreamOptions;

  constructor(options: ChunkingStreamOptions) {
    super();

    this._options = options;
  }

  _transform(buffer: Buffer | string, encoding: string, callback: () => void) {
    if (this._options.outgoing) {
      this._processOutput(buffer, encoding, callback);
    } else {
      this._processInput(buffer, encoding, callback);
    }
  }

  _processOutput(
    buffer: Buffer | string,
    encoding: string,
    callback: () => void,
  ) {
    const tempBuffer =
      typeof buffer === 'string' ? Buffer.from(buffer) : buffer;

    const lengthChunk = messageLengthBytes(tempBuffer);
    this.push(
      Buffer.concat(lengthChunk ? [lengthChunk, tempBuffer] : [tempBuffer]),
    );
    process.nextTick(callback);
  }

  _processInput(
    buffer: Buffer | string,
    encoding: string,
    callback: () => void,
  ) {
    try {
      let copyStart = 0;
      const tempBuffer: Buffer =
        typeof buffer === 'string' ? Buffer.from(buffer) : buffer;

      if (this._combinedBuffer === null) {
        const expectedLength: number =
          (tempBuffer[0] << 8) + parseInt(buffer[1].toString(), 10);
        this._combinedBuffer = Buffer.alloc(expectedLength);
        this._currentOffset = 0;
        copyStart = 2;
      }

      const combinedBuffer = this._combinedBuffer;
      if (combinedBuffer == null) {
        return;
      }

      const copyEnd = Math.min(
        buffer.length,
        combinedBuffer.length - this._currentOffset + copyStart,
      );

      this._currentOffset += tempBuffer.copy(
        combinedBuffer,
        this._currentOffset,
        copyStart,
        copyEnd,
      );

      if (this._currentOffset !== combinedBuffer.length) {
        process.nextTick(callback);
        return;
      }

      this.push(combinedBuffer);
      this._combinedBuffer = null;

      if (tempBuffer.length <= copyEnd) {
        process.nextTick(callback);
        return;
      }

      const remainder = buffer.slice(copyEnd);
      process.nextTick((): void =>
        this._processInput(remainder, encoding, callback),
      );
    } catch (error) {
      logger.error({ err: error }, 'ChunkingStream error!');
      process.nextTick(callback);
    }
  }
}

export default ChunkingStream;
