import { Transform } from 'stream';
import Logger from './logger';
const logger = Logger.createModuleLogger(module);

/**
 Our job here is to accept messages in whole chunks, and put their length in front
 as we send them out, and parse them back into those size chunks as we read them in.

 If TCP splits the 2-byte length prefix across reads, `_pendingLead` holds bytes
 until the next chunk so we never read `[len_hi, undefined]` as a length.

 * */
/* eslint-disable no-bitwise */

const MSG_LENGTH_BYTES = 2;

const messageLengthBytes = (
  message: Buffer | string,
): Buffer | null | undefined => {
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
  /** When starting a frame, leftover bytes (< 2) until we can read BE length. */
  _pendingLead: Buffer | null = null;

  _combinedBuffer: Buffer | null = null;

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
    _encoding: string,
    callback: () => void,
  ) {
    const tempBuffer =
      typeof buffer === 'string' ? Buffer.from(buffer) : buffer;

    const lengthChunk = messageLengthBytes(tempBuffer);
    this.push(
      Buffer.concat(
        (lengthChunk
          ? [lengthChunk, tempBuffer]
          : [tempBuffer]) as readonly Uint8Array[],
      ),
    );
    process.nextTick(callback);
  }

  _processInput(
    buffer: Buffer | string,
    _encoding: string,
    callback: () => void,
  ) {
    try {
      let merged =
        typeof buffer === 'string' ? Buffer.from(buffer) : buffer;

      if (this._pendingLead?.length) {
        merged = Buffer.concat([
          this._pendingLead,
          merged,
        ] as readonly Uint8Array[]);
        this._pendingLead = null;
      }

      let offset = 0;

      /** One TCP `_transform`; process every full frame plus partial tail in `merged`. */
      while (true) {
        if (this._combinedBuffer === null) {
          if (offset >= merged.length) {
            break;
          }
          const left = merged.length - offset;
          if (left < MSG_LENGTH_BYTES) {
            this._pendingLead = merged.subarray(offset);
            break;
          }

          const expectedLength = merged.readUInt16BE(offset);
          offset += MSG_LENGTH_BYTES;

          this._combinedBuffer = Buffer.alloc(expectedLength);
          this._currentOffset = 0;
        }

        const buf = this._combinedBuffer!;

        if (this._currentOffset === buf.length) {
          this.push(buf);
          this._combinedBuffer = null;
          continue;
        }

        const need = buf.length - this._currentOffset;
        const avail = merged.length - offset;

        if (avail === 0) {
          break;
        }

        const take = Math.min(need, avail);
        merged.copy(buf as Uint8Array, this._currentOffset, offset, offset + take);
        this._currentOffset += take;
        offset += take;

        if (this._currentOffset === buf.length) {
          this.push(buf);
          this._combinedBuffer = null;
        }
      }

      process.nextTick(callback);
    } catch (error) {
      logger.error({ err: error }, 'ChunkingStream error!');
      process.nextTick(callback);
    }
  }
}

export default ChunkingStream;
