import ChunkingStream from '../lib/ChunkingStream';

/** Narrow for Node typings (Buffer vs Uint8Array covariance). */
function concatBuffers(buffers: Buffer[]): Buffer {
  return Buffer.concat(buffers as readonly Uint8Array[]);
}

/** Copy chunk from Transform `data` to a standalone Buffer without typing friction. */
function copyStreamChunk(d: Buffer): Buffer {
  return Buffer.from(d as Uint8Array);
}

/** [len_hi, len_lo] + payload (BE uint16 length = payload byte length) */
function frame(payload: Buffer): Buffer {
  const len = payload.length;
  return concatBuffers([
    Buffer.from([(len >>> 8) & 0xff, len & 0xff]),
    payload,
  ]);
}

/** Split `buf` into consecutive TCP chunks with the given slice sizes (must sum to buf.length). */
function tcpSplit(buf: Buffer, sliceSizes: number[]): Buffer[] {
  let offset = 0;
  const out: Buffer[] = [];
  for (const n of sliceSizes) {
    out.push(buf.subarray(offset, offset + n));
    offset += n;
  }
  expect(offset).toBe(buf.length);
  return out;
}

/**
 * Pre-fix inbound behavior (broken `copyEnd`, length parsing, no `_pendingLead`).
 * Mirrors legacy `ChunkingStream._processInput` so we compare outputs where it
 * used to behave correctly (no throw / NaN).
 */
type LegacyInboundState = {
  combinedBuffer: Buffer | null;
  currentOffset: number;
};

function legacyInboundProcess(
  state: LegacyInboundState,
  bufferParam: Buffer,
  onMessage: (buf: Buffer) => void,
): void {
  let copyStart = 0;
  const tempBuffer = bufferParam;

  if (state.combinedBuffer === null) {
    const expectedLength =
      (tempBuffer[0] << 8) + parseInt(tempBuffer[1].toString(), 10);
    state.combinedBuffer = Buffer.alloc(expectedLength);
    state.currentOffset = 0;
    copyStart = 2;
  }

  const combinedBuffer = state.combinedBuffer;
  if (combinedBuffer == null) {
    return;
  }

  const copyEnd = Math.min(
    bufferParam.length,
    combinedBuffer.length - state.currentOffset + copyStart,
  );

  state.currentOffset += tempBuffer.copy(
    combinedBuffer as Uint8Array,
    state.currentOffset,
    copyStart,
    copyEnd,
  );

  if (state.currentOffset !== combinedBuffer.length) {
    return;
  }

  onMessage(combinedBuffer);
  state.combinedBuffer = null;

  if (tempBuffer.length <= copyEnd) {
    return;
  }

  const remainder = bufferParam.subarray(copyEnd);
  legacyInboundProcess(state, remainder, onMessage);
}

function legacyInboundRun(tcpChunks: Buffer[]): Buffer[] {
  const out: Buffer[] = [];
  const state: LegacyInboundState = {
    combinedBuffer: null,
    currentOffset: 0,
  };
  const pushCopy = (m: Buffer): void => {
    out.push(copyStreamChunk(m));
  };
  for (const chunk of tcpChunks) {
    legacyInboundProcess(state, chunk, pushCopy);
  }
  return out;
}

/**
 * Sequential writes to ChunkingStream; each write completes before the next (`drain` / callback).
 */
async function writeChunksSequential(
  cs: ChunkingStream,
  chunks: ReadonlyArray<Buffer | string>,
): Promise<void> {
  for (let i = 0; i < chunks.length; i += 1) {
    const chunk = chunks[i];
    await new Promise<void>((resolve, reject) => {
      /* Mutual stream cleanup handlers (`finish` / `onErr`) reference each other. */
      /* eslint-disable @typescript-eslint/no-use-before-define */
      let settled = false;

      function finish(): void {
        if (settled) {
          return;
        }
        settled = true;
        cs.off('error', onErr);
        cs.off('drain', finish);
        resolve();
      }

      function onErr(err: Error): void {
        if (settled) {
          return;
        }
        settled = true;
        cs.off('drain', finish);
        reject(err);
      }

      cs.once('error', onErr);

      const flushed = cs.write(chunk, undefined, finish);
      if (!flushed) {
        cs.once('drain', finish);
      }
      /* eslint-enable @typescript-eslint/no-use-before-define */
    });
  }
}

async function collectIncoming(tcpChunks: Buffer[]): Promise<Buffer[]> {
  const cs = new ChunkingStream({ outgoing: false });
  const out: Buffer[] = [];
  cs.on('data', (d: Buffer) => {
    out.push(copyStreamChunk(d));
  });
  await writeChunksSequential(cs, tcpChunks);
  cs.end();

  await new Promise<void>((resolve, reject) => {
    cs.once('error', reject);
    cs.once('end', resolve);
  });

  return out;
}

async function collectOutgoing(
  writes: ReadonlyArray<Buffer | string>,
): Promise<Buffer[]> {
  const cs = new ChunkingStream({ outgoing: true });
  const out: Buffer[] = [];
  cs.on('data', (d: Buffer) => {
    out.push(copyStreamChunk(d));
  });
  await writeChunksSequential(cs, writes);
  cs.end();

  await new Promise<void>((resolve, reject) => {
    cs.once('error', reject);
    cs.once('end', resolve);
  });

  return out;
}

describe('ChunkingStream', () => {
  describe('outgoing (_processOutput)', () => {
    it('prepends BE uint16 length then payload (matches frame())', async () => {
      const payload = Buffer.from([1, 2, 3, 4]);
      const fr = collectOutgoing([payload]).then((parts) =>
        concatBuffers(parts),
      );
      await expect(fr).resolves.toEqual(frame(payload));
    });

    it('empty payload emits only two zero length bytes', async () => {
      const wired = concatBuffers(await collectOutgoing([Buffer.alloc(0)]));
      expect(wired).toEqual(frame(Buffer.alloc(0)));
    });

    it('high length bytes (257-byte payload)', async () => {
      const payload = Buffer.alloc(257, 0xab);
      const wired = concatBuffers(await collectOutgoing([payload]));
      expect(wired.slice(2).every((b) => b === 0xab)).toBe(true);
      expect(wired.readUInt16BE(0)).toBe(257);
    });

    it('string input produces UTF-8 body with length prefix of string length', async () => {
      const s = 'hi';
      const out = await collectOutgoing([s]);
      expect(out).toHaveLength(1);
      expect(out[0].readUInt16BE(0)).toBe(2);
      expect(out[0].subarray(2)).toEqual(Buffer.from(s, 'utf8'));
    });

    it('multiple write() calls emit one framed blob each', async () => {
      const a = Buffer.from([1]);
      const b = Buffer.from([2, 3]);
      const parts = await collectOutgoing([a, b]);
      expect(parts).toHaveLength(2);
      expect(parts[0]).toEqual(frame(a));
      expect(parts[1]).toEqual(frame(b));
    });
  });

  describe('incoming — parity vs legacy simulator', () => {
    const cases: { name: string; tcpChunks: Buffer[] }[] = [
      {
        name: 'one whole frame in one TCP chunk',
        tcpChunks: [frame(Buffer.from([1, 2, 3]))],
      },
      {
        name: 'length + partial payload, then rest',
        tcpChunks: (() => {
          const f = frame(Buffer.from([1, 2, 3, 4, 5]));
          return [f.subarray(0, 3), f.subarray(3)];
        })(),
      },
      {
        name: 'length + 1 payload byte, then rest',
        tcpChunks: (() => {
          const f = frame(Buffer.from([9, 8, 7]));
          return [f.subarray(0, 4), f.subarray(4)];
        })(),
      },
      {
        name: 'two frames in one TCP chunk',
        tcpChunks: [
          concatBuffers([
            frame(Buffer.from([0xaa])),
            frame(Buffer.from([0xbb, 0xcc])),
          ]),
        ],
      },
      {
        name: 'three frames in one TCP chunk',
        tcpChunks: [
          concatBuffers([
            frame(Buffer.from([0x01])),
            frame(Buffer.from([0x02, 0x03])),
            frame(Buffer.from([0x04, 0x05, 0x06])),
          ]),
        ],
      },
      {
        name: 'header plus partial payload first, remainder in many 1-byte TCP chunks',
        tcpChunks: (() => {
          const payload = Buffer.from('abcdefghijklmnop', 'ascii');
          const w = frame(payload);
          return tcpSplit(w, [10, ...Array(w.length - 10).fill(1)]);
        })(),
      },
    ];

    it.each(cases)('$name', async ({ tcpChunks }) => {
      const legacy = legacyInboundRun(tcpChunks);
      const current = await collectIncoming(tcpChunks);
      expect(current.map((b) => b.toString('hex'))).toEqual(
        legacy.map((b) => b.toString('hex')),
      );
    });

    /**
     * Node may not emit `data` for a pushed empty Buffer; legacy still yields one empty message.
     */
    it('zero-length payload legacy vs current handling', async () => {
      const wire = frame(Buffer.alloc(0));
      const legacy = legacyInboundRun([wire]);
      expect(legacy).toHaveLength(1);
      expect(legacy[0].length).toBe(0);

      const current = await collectIncoming([wire]);
      if (current.length === 0) {
        expect(legacy[0].length).toBe(0);
      } else {
        expect(current.map((b) => b.toString('hex'))).toEqual(
          legacy.map((b) => b.toString('hex')),
        );
      }
    });

    it('incoming UTF-8 string chunk matches Buffer for ASCII-framed payload', async () => {
      const asciiPayload = Buffer.from('ok!');
      const wire = frame(asciiPayload);
      const bufOut = await collectIncoming([wire]);
      const cs = new ChunkingStream({ outgoing: false });
      const strOut: Buffer[] = [];
      cs.on('data', (d: Buffer) => strOut.push(copyStreamChunk(d)));
      await writeChunksSequential(cs, [wire.toString('utf8')]);
      cs.end();
      await new Promise<void>((resolve, reject) => {
        cs.once('error', reject);
        cs.once('end', resolve);
      });
      expect(strOut.map((b) => b.toString('hex'))).toEqual(
        bufOut.map((b) => b.toString('hex')),
      );
    });
  });

  describe('incoming — split length prefix (bug fix)', () => {
    it('first TCP chunk is only high byte of length; second completes header + payload', async () => {
      const payload = Buffer.from([0xde, 0xad, 0xbe, 0xef]);
      const full = frame(payload);
      const tcpChunks = [full.subarray(0, 1), full.subarray(1)];

      expect(() => legacyInboundRun(tcpChunks)).toThrow();

      const out = await collectIncoming(tcpChunks);
      expect(out).toHaveLength(1);
      expect(out[0]).toEqual(payload);
    });

    it('length prefix split for second frame after prior frame (pendingLead resets)', async () => {
      const p1 = Buffer.from([1, 2, 3]);
      const p2 = Buffer.from([9, 8, 7, 6]);
      const w1 = frame(p1);
      const w2 = frame(p2);
      const tcpChunks = [w1, w2.subarray(0, 1), w2.subarray(1)];

      const out = await collectIncoming(tcpChunks);
      expect(out).toHaveLength(2);
      expect(out[0]).toEqual(p1);
      expect(out[1]).toEqual(p2);
    });

    it('exactly two-byte wire (zero-length payload) split across chunks [0],[0]', async () => {
      const wire = frame(Buffer.alloc(0));
      expect(wire.length).toBe(2);
      expect(() =>
        legacyInboundRun([wire.subarray(0, 1), wire.subarray(1)]),
      ).toThrow();
      await expect(
        collectIncoming([wire.subarray(0, 1), wire.subarray(1)]),
      ).resolves.toEqual([]);
    });

    /**
     * With correct implementation zero-length parses from [00][00] after merge;
     * legacy simulator throws calling tempBuffer[1].toString on first 1-byte chunk.
     */
  });

  describe('round-trip (outgoing then incoming)', () => {
    it('recovers original payloads when non-empty (empty emits may not produce data)', async () => {
      const payloads = [Buffer.from([10]), Buffer.alloc(64, 0xee)];
      const framedParts = await collectOutgoing(payloads);
      const wire = concatBuffers(framedParts);

      const got = await collectIncoming([wire]);
      expect(got).toHaveLength(2);
      expect(got[0]).toEqual(payloads[0]);
      expect(got[1]).toEqual(payloads[1]);
    });

    /**
     * Surfaces synchronous throws inside `_processInput` so the catch + log path runs
     * (defensive; real devices should not trigger OOM here).
     */
    it('incoming: Buffer.alloc throws during frame construction are caught', async () => {
      const realAlloc = Buffer.alloc.bind(Buffer);
      const spy = jest.spyOn(Buffer, 'alloc').mockImplementation(((
        size: number,
        ...args: unknown[]
      ) => {
        if (size === 33) {
          throw new Error('simulated alloc failure');
        }
        return (realAlloc as (s: number, ...a: unknown[]) => Buffer)(
          size,
          ...args,
        );
      }) as typeof Buffer.alloc);
      try {
        const payload = Buffer.from(new Uint8Array(33).fill(0x17));
        const wire = frame(payload);
        await expect(collectIncoming([wire])).resolves.toEqual([]);
      } finally {
        spy.mockRestore();
      }
    });

    it('multiple framed writes concatenated parse as sequential messages', async () => {
      const p1 = Buffer.from('a');
      const p2 = Buffer.from('bb');
      const chunks = await collectOutgoing([p1, p2]);
      const recombined = await collectIncoming([concatBuffers(chunks)]);
      expect(recombined.length).toBe(2);
      expect(recombined[0]).toEqual(p1);
      expect(recombined[1]).toEqual(p2);
    });
  });
});
