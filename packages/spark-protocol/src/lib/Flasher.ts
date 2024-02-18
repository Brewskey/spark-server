import { Packet, ParsedPacket } from 'coap-packet';
import crc32 from 'buffer-crc32';
import nullthrows from 'nullthrows';
import { FileTransferStore } from './FileTransferStore';

import BufferStream from './BufferStream';
import CoapMessages from './CoapMessages';
import type Device from '../clients/Device';
import ProtocolErrors from './ProtocolErrors';
import Logger from './logger';
const logger = Logger.createModuleLogger(module);
//
// UpdateBegin — sent by Server to initiate an OTA firmware update
// UpdateReady — sent by Device to indicate readiness to receive firmware chunks
// Chunk — sent by Server to send chunks of a firmware binary to Device
// ChunkReceived — sent by Device to respond to each chunk, indicating the CRC of
// the received chunk data.  if Server receives CRC that does not match the chunk just sent,
// that chunk is sent again
// UpdateDone — sent by Server to indicate all firmware chunks have been sent
//

const CHUNK_SIZE = 256;
const MAX_MISSED_CHUNKS = 10;
const MAX_BINARY_SIZE = 108000; // According to the forums this is the max size for device.

class Flasher {
  _chunk: Buffer | null | undefined = null;

  _chunkSize: number = CHUNK_SIZE;

  _maxBinarySize: number = MAX_BINARY_SIZE;

  _chunkIndex: number = 0;

  _client: Device;

  _fileStream: BufferStream | null | undefined = null;

  _lastCrc: number | null | undefined = null;

  _protocolVersion: number = 0;

  _startTime: Date | null | undefined;

  _missedChunks: Set<number> = new Set();

  // OTA tweaks
  _fastOtaEnabled: boolean = true;

  _ignoreMissedChunks: boolean = false;

  constructor(
    client: Device,
    maxBinarySize?: number | null,
    otaChunkSize?: number | null,
  ) {
    this._client = client;
    this._maxBinarySize = maxBinarySize || MAX_BINARY_SIZE;
    this._chunkSize = otaChunkSize || CHUNK_SIZE;
  }

  async startFlashBuffer(
    buffer?: Buffer | null,
    fileTransferStore: FileTransferStore = FileTransferStore.FIRMWARE,
    address: string = '0x0',
  ) {
    if (!buffer || buffer.length === 0) {
      logger.error(
        {
          deviceID: this._client.getDeviceID(),
          err: new Error('Empty file buffer'),
        },
        'Flash failed! - file is empty! ',
      );

      throw new Error('Update failed - File was empty!');
    }

    if (buffer && buffer.length > this._maxBinarySize) {
      logger.error(
        {
          deviceID: this._client.getDeviceID(),
          err: new Error('Flash: File too large'),
          length: buffer.length,
        },
        'Flash failed! - file is too large',
      );

      throw new Error('Update failed - File was too big!');
    }

    try {
      if (!this._claimConnection()) {
        return;
      }

      this._startTime = new Date();

      this._prepare(buffer);
      await this._beginUpdate(buffer, fileTransferStore, address);
      await Promise.race([
        // Fail after 60 of trying to flash
        new Promise(
          (resolve: (_: unknown) => void, reject: (error: Error) => void) => {
            setTimeout(
              (): void => reject(new Error('Update timed out')),
              60 * 1000,
            );
          },
        ),
        this._sendFile(),
      ]);

      this._cleanup();
    } catch (error) {
      this._cleanup();
      throw error;
    }
  }

  _prepare(fileBuffer?: Buffer | null) {
    // make sure we have a file,
    // open a stream to our file
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error('Flasher: this.fileBuffer was empty.');
    } else {
      this._fileStream = new BufferStream(fileBuffer);
    }

    this._chunk = null;
    this._lastCrc = null;

    this._chunkIndex = -1;

    // start listening for missed chunks before the update fully begins
    this._client.on('ChunkMissed', (packet: Packet): void =>
      this._onChunkMissed(packet),
    );
  }

  _claimConnection(): boolean {
    // suspend all other messages to the device
    if (!this._client.takeOwnership(this)) {
      throw new Error('Flasher: Unable to take ownership');
    }

    return true;
  }

  async _beginUpdate(
    buffer: Buffer,
    fileTransferStore: FileTransferStore,
    address: string,
  ) {
    let maxTries = 3;

    const tryBeginUpdate = async () => {
      if (maxTries < 0) {
        throw new Error('Failed waiting on UpdateReady - out of retries ');
      }

      // NOTE: this is 6 because it's double the ChunkMissed 3 second delay
      // The 90 second delay is crazy but try it just in case.
      const delay = maxTries > 0 ? 6 : 90;
      const sentStatus = this._sendBeginUpdateMessage(
        buffer,
        fileTransferStore,
        address,
      );
      maxTries -= 1;

      // did we fail to send out the UpdateBegin message?
      if (sentStatus === false) {
        throw new Error('UpdateBegin failed - sendMessage failed');
      }

      // Wait for UpdateReady — sent by device to indicate readiness to receive
      // firmware chunks
      const packet = await Promise.race([
        this._client.listenFor('UpdateReady', /* uri */ null, /* token */ null),
        this._client
          .listenFor('UpdateAbort', /* uri */ null, /* token */ null)
          .then((newPacket?: ParsedPacket | null) => {
            let failReason = '';
            if (newPacket && newPacket.payload && newPacket.payload.length) {
              failReason = newPacket.payload.readUInt8(0).toString();
            }

            failReason = !Number.isNaN(failReason)
              ? ProtocolErrors.get(Number.parseInt(failReason, 10)) ||
                failReason
              : failReason;

            throw new Error(`aborted: ${failReason}`);
          }),

        // Try to update multiple times
        new Promise((resolve: (_: void) => void) => {
          setTimeout(() => {
            if (maxTries <= 0) {
              return;
            }

            tryBeginUpdate();
            resolve();
          }, delay * 1000);
        }),
      ]);

      // Message will be null if the message isn't read by the device and we are
      // retrying
      if (!packet) {
        return;
      }

      maxTries = 0;

      let version = 0;
      if (packet && packet.payload.length > 0) {
        version = packet.payload.readUInt8(0);
      }
      this._protocolVersion = version;
    };

    await tryBeginUpdate();
  }

  _sendBeginUpdateMessage(
    fileBuffer: Buffer,
    fileTransferStore: FileTransferStore,
    address: string,
  ): boolean {
    // (MDM Proposal) Optional payload to enable fast OTA and file placement:
    // u8  flags 0x01 - Fast OTA available - when set the server can
    // provide fast OTA transfer
    // u16 chunk size. Each chunk will be this size apart from the last which
    // may be smaller.
    // u32 file size. The total size of the file.
    // u8 destination. Where to store the file
    // 0x00 Firmware update
    // 0x01 External Flash
    // 0x02 User Memory Function
    // u32 destination address (0 for firmware update, otherwise the address
    // of external flash or user memory.)

    let flags = 0; // fast ota available
    const chunkSize = this._chunkSize;
    const fileSize = fileBuffer.length;
    const destFlag = fileTransferStore;
    const destAddr = parseInt(address, 10);

    if (this._fastOtaEnabled) {
      logger.info(this._getLogInfo(), 'fast ota enabled! ');
      flags = 1;
    }

    // UpdateBegin — sent by Server to initiate an OTA firmware update
    return !!this._client.sendMessage(
      'UpdateBegin',
      null,
      null,
      Buffer.concat([
        CoapMessages.toBinary(flags, 'uint8'),
        CoapMessages.toBinary(chunkSize, 'uint16'),
        CoapMessages.toBinary(fileSize, 'uint32'),
        CoapMessages.toBinary(destFlag, 'uint8'),
        CoapMessages.toBinary(destAddr, 'uint32'),
      ]),
      this,
    );
  }

  async _sendFile() {
    this._chunk = null;
    this._lastCrc = null;

    // while iterating over our file...
    // Chunk — sent by Server to send chunks of a firmware binary to Device
    // ChunkReceived — sent by Device to respond to each chunk, indicating the CRC
    //  of the received chunk data.  if Server receives CRC that does not match
    //  the chunk just sent, that chunk is sent again

    // send when ready:
    // UpdateDone — sent by Server to indicate all firmware chunks have been sent

    const canUseFastOTA = this._fastOtaEnabled && this._protocolVersion > 0;
    if (canUseFastOTA) {
      logger.info(
        {
          deviceID: this._client.getDeviceID(),
        },
        'Starting FastOTA update',
      );
    }

    this._readNextChunk();
    while (this._chunk) {
      const messageToken = this._sendChunk(this._chunkIndex);
      this._readNextChunk();
      // We don't need to wait for the response if using FastOTA.
      if (canUseFastOTA) {
        continue; // eslint-disable-line no-continue
      }

      // eslint-disable-next-line no-await-in-loop
      const message = await this._client.listenFor(
        'ChunkReceived',
        null,
        messageToken,
      );

      logger.info(
        {
          deviceID: this._client.getDeviceID(),
          message,
        },
        'Chunk Received',
      );

      if (!CoapMessages.statusIsOkay(message)) {
        throw new Error("'ChunkReceived' failed.");
      }
    }

    if (canUseFastOTA) {
      // Wait a whle for the error messages to come in for FastOTA
      await this._waitForMissedChunks();
    }

    // Handle missed chunks. Wait a maximum of 12 seconds
    let counter = 0;
    while (this._missedChunks.size > 0 && counter < 3) {
      // eslint-disable-next-line no-await-in-loop
      await this._resendChunks();
      // eslint-disable-next-line no-await-in-loop
      await this._waitForMissedChunks();
      counter += 1;
    }

    // cleanup
    await this._onAllChunksDone();
  }

  async _resendChunks() {
    const missedChunks = Array.from(this._missedChunks);
    this._missedChunks.clear();

    const canUseFastOTA = this._fastOtaEnabled && this._protocolVersion > 0;
    await Promise.all(
      missedChunks.map(async (chunkIndex: number) => {
        const offset = chunkIndex * this._chunkSize;
        nullthrows(this._fileStream).seek(offset);
        this._chunkIndex = chunkIndex;

        this._readNextChunk();
        const messageToken = this._sendChunk(chunkIndex);

        // We don't need to wait for the response if using FastOTA.
        if (!canUseFastOTA) {
          return;
        }

        const message = await this._client.listenFor(
          'ChunkReceived',
          null,
          messageToken,
        );

        if (!CoapMessages.statusIsOkay(message)) {
          throw new Error("'ChunkReceived' failed.");
        }
      }),
    );
  }

  _readNextChunk() {
    if (!this._fileStream) {
      logger.error(
        {
          deviceID: this._client.getDeviceID(),
        },
        'Asked to read a chunk after the update was finished',
      );
    }

    let chunk = this._fileStream
      ? this._fileStream.read(this._chunkSize)
      : null;
    this._chunk = chunk;

    // workaround for https://github.com/spark/core-firmware/issues/238
    if (chunk && chunk.length !== this._chunkSize) {
      const buffer = Buffer.alloc(this._chunkSize);
      chunk.copy(buffer, 0, 0, chunk.length);
      buffer.fill(0, chunk.length, this._chunkSize);
      chunk = buffer;
      this._chunk = chunk;
    }

    this._chunkIndex += 1;
    // end workaround
    this._lastCrc = chunk ? crc32.unsigned(chunk) : null;
  }

  _sendChunk(chunkIndex: number | null = 0): number {
    const encodedCrc = CoapMessages.toBinary(nullthrows(this._lastCrc), 'crc');

    const args = [encodedCrc];
    if (this._fastOtaEnabled && this._protocolVersion > 0) {
      args.push(CoapMessages.toBinary(chunkIndex, 'uint16'));
    }
    return this._client.sendMessage('Chunk', { args }, null, this._chunk, this);
  }

  async _onAllChunksDone() {
    if (!this._client.sendMessage('UpdateDone', null, null, null, this)) {
      logger.warn('Flasher - failed sending updateDone message');
    }
  }

  _cleanup() {
    try {
      // resume all other messages to the device
      this._client.releaseOwnership(this);

      // release our file handle
      const fileStream = this._fileStream;
      if (fileStream) {
        fileStream.close();
        this._fileStream = null;
      }
    } catch (error) {
      throw new Error(`Flasher: error during cleanup ${error}`);
    }
  }

  /*
   * delay the teardown until 4 seconds after the last
   * chunkmissed message.
   */
  async _waitForMissedChunks() {
    if (this._protocolVersion <= 0) {
      // this doesn't apply to normal slow ota
      return;
    }

    const startingChunkCount = this._missedChunks.size;
    let counter = 0;

    // poll every 500ms to see if a new chunk came in and exit this early.
    // wait a total of 5 seconds
    await new Promise((resolve: (_: void) => void) => {
      const interval = setInterval(() => {
        counter += 1;
        if (startingChunkCount !== this._missedChunks.size) {
          clearInterval(interval);
          resolve();
          return;
        }

        // 200ms * 5 * 4 / 1000
        if (counter >= 20) {
          logger.info(
            {
              deviceID: this._client.getDeviceID(),
            },
            'Finished Waiting',
          );
          clearInterval(interval);
          resolve();
        }
      }, 200);
    });
  }

  _getLogInfo(): {
    cache_key?: string;
    deviceID: string;
  } {
    if (this._client) {
      return {
        cache_key: this._client._connectionKey || undefined,
        deviceID: this._client.getDeviceID(),
      };
    }

    return { deviceID: 'unknown' };
  }

  _onChunkMissed(packet: Packet) {
    if (this._missedChunks.size > MAX_MISSED_CHUNKS) {
      const json = JSON.stringify(this._getLogInfo());
      throw new Error(
        `flasher - chunk missed - device over limit, killing! ${json}`,
      );
    }

    // if we're not doing a fast OTA, and ignore missed is turned on, then
    // ignore this missed chunk.
    if (!this._fastOtaEnabled && this._ignoreMissedChunks) {
      logger.info(this._getLogInfo(), 'Ignoring missed chunk');
      return;
    }

    logger.warn(this._getLogInfo(), 'Flasher - chunk missed - recovering ');

    // kosher if I ack before I've read the payload?
    this._client.sendReply(
      'ChunkMissedAck',
      packet.messageId || 0,
      null,
      null,
      this,
    );

    // the payload should include one or more chunk indexes
    const { payload } = packet;
    if (!payload) {
      logger.warn(this._getLogInfo(), 'Flasher -- empty packet');
      return;
    }
    for (let ii = 0; ii < payload.length; ii += 2) {
      try {
        this._missedChunks.add(payload.readUInt16BE());
      } catch (error) {
        logger.error(
          { deviceID: this._client.getDeviceID(), err: error },
          'onChunkMissed error reading payload',
        );
      }
    }
  }
}

export default Flasher;
