import { Transform } from 'stream';

/**
 Our job here is to accept messages in whole chunks, and put their length in front
 as we send them out, and parse them back into those size chunks as we read them in.
 **/
/* eslint-disable no-bitwise */

const MSG_LENGTH_BYTES = 2;
const messageLengthBytes = (
  message: Buffer | string,
): Buffer | null | undefined => {
  // assuming a maximum encrypted message length of 65K, lets write an
  // unsigned short int before every message, so we know how much to read out.
  if (!message) {
    return null;
  }

  const length = message.length;
  const lengthBuffer = Buffer.alloc(MSG_LENGTH_BYTES);

  lengthBuffer[0] = length >>> 8;
  lengthBuffer[1] = length & 255;

  return lengthBuffer;
};

type ChunkingStreamOptions = {
  outgoing?: boolean;
};

class ChunkingStream extends Transform {
  _expectedLength!: number;
  _incomingBuffer: Buffer | null | undefined = null;
  _incomingIndex: number = -1;
  _outgoing: boolean;

  constructor(options: ChunkingStreamOptions) {
    super();

    this._outgoing = !!options.outgoing;
  }

  process = (chunk: Buffer | null | undefined, callback: any) => {
    if (!chunk) {
      return;
    }

    const isNewMessage = this._incomingIndex === -1;
    let startIndex = 0;
    if (isNewMessage) {
      this._expectedLength = (chunk[0] << 8) + chunk[1];

      // if we don't have a buffer, make one as big as we will need.
      this._incomingBuffer = Buffer.alloc(this._expectedLength);
      this._incomingIndex = 0;
      startIndex = 2; // skip the first two.
    }

    const bytesLeft = this._expectedLength - this._incomingIndex;
    let endIndex = startIndex + bytesLeft;
    if (endIndex > chunk.length) {
      endIndex = chunk.length;
    }

    if (startIndex < endIndex && this._incomingBuffer) {
      if (this._incomingIndex >= this._incomingBuffer.length) {
        throw new Error("hmm, shouldn't end up here.");
      }

      chunk.copy(
        this._incomingBuffer,
        this._incomingIndex,
        startIndex,
        endIndex,
      );
    }

    this._incomingIndex += endIndex - startIndex;

    let remainder: Buffer | null = null;
    if (endIndex < chunk.length) {
      remainder = Buffer.alloc(chunk.length - endIndex);
      chunk.copy(remainder, 0, endIndex, chunk.length);
    }

    if (this._incomingIndex === this._expectedLength && this._incomingBuffer) {
      this.push(this._incomingBuffer);
      this._incomingBuffer = null;
      this._incomingIndex = -1;
      this._expectedLength = -1;
      if (!remainder && callback) {
        process.nextTick(callback);
      } else {
        process.nextTick((): void => this.process(remainder, callback));
      }
    } else {
      process.nextTick(callback);
    }
  };

  _transform = (chunk: Buffer | string, _encoding: string, callback: any) => {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);

    if (this._outgoing) {
      // we should be passed whole messages here.
      // write our length first, then message, then bail.
      const lengthChunk = messageLengthBytes(chunk);
      this.push(Buffer.concat(lengthChunk ? [lengthChunk, buffer] : [buffer]));
      process.nextTick(callback);
    } else {
      // Collect chunks until we hit an expected size, and then trigger a
      // readable
      try {
        process.nextTick((): void => this.process(buffer, callback));
      } catch (error: any) {
        throw new Error(`ChunkingStream error!: ${error}`);
      }
    }
  };
}

export default ChunkingStream;
