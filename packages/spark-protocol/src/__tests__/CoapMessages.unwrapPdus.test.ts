import CoapPacket from 'coap-packet';

import CoapMessages from '../lib/CoapMessages';

describe('CoapMessages.unwrapPdus', () => {
  it('returns empty array for missing or zero-length plaintext', () => {
    expect(CoapMessages.unwrapPdus(null)).toEqual([]);
    expect(CoapMessages.unwrapPdus(Buffer.alloc(0))).toEqual([]);
  });

  it('returns empty array when plaintext cannot peel as CoAP', () => {
    expect(CoapMessages.unwrapPdus(Buffer.from([0xff, 0xff, 0xff]))).toEqual(
      [],
    );
  });

  it('parses two concatenated CoAP PDUs (coap-packet.parse alone would mis-parse options)', () => {
    /*
     * Plaintext glue is only peeled when concat is not a canonical single wire
     * (wire(parse(whole)) !== whole); some pairs round-trip as one bogus PDU and
     * must be treated as a single message. These IDs/tokens produce a non-canon glue.
     */
    const pkt1 = CoapPacket.generate({
      confirmable: true,
      code: '2.05',
      messageId: 100,
      token: Buffer.from([0]),
      options: [{ name: 'Uri-Path', value: Buffer.from('a') }],
      payload: Buffer.from([]),
    });
    const pkt2 = CoapPacket.generate({
      confirmable: true,
      code: '2.05',
      messageId: 200,
      token: Buffer.from([0]),
      options: [{ name: 'Uri-Path', value: Buffer.from('b') }],
      payload: Buffer.from([]),
    });
    const combined = Buffer.concat([pkt1, pkt2]);
    const decoded = CoapMessages.unwrapPdus(combined);

    expect(decoded).toHaveLength(2);
    expect(decoded[0].messageId).toBe(100);
    expect(decoded[1].messageId).toBe(200);
  });

  it('falls back to a single PDU when plaintext is normal', () => {
    const pkt = CoapPacket.generate({
      confirmable: false,
      code: '2.05',
      messageId: 42,
      token: Buffer.alloc(0),
      options: [],
      payload: Buffer.from('hello'),
    });
    expect(CoapMessages.unwrapPdus(pkt)).toHaveLength(1);
    expect(CoapMessages.unwrap(pkt)?.messageId).toBe(42);
  });
});

describe('CoapMessages.unwrap (compat)', () => {
  it('delegates unwrapPdus and yields the first PDU only', () => {
    const pkt = CoapPacket.generate({
      confirmable: false,
      code: '2.05',
      messageId: 7,
      token: Buffer.alloc(0),
      options: [],
      payload: Buffer.from('hello'),
    });
    expect(CoapMessages.unwrap(pkt)?.messageId).toBe(7);
  });
});
