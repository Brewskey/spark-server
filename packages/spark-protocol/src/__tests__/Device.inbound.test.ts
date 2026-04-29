import type { ParsedPacket as CoapPacket } from 'coap-packet';
import type { Socket } from 'net';
import type Handshake from '../lib/Handshake';

import CoapPacketLib from 'coap-packet';
import Device from '../clients/Device';
import CoapMessages from '../lib/CoapMessages';

type HandshakeStartResult = {
  cipherStream: object;
  decipherStream: object;
  deviceID: string;
  handshakeBuffer: Buffer;
};

function helloWireWithPayload(messageId: number): Buffer {
  const payload = Buffer.alloc(8);
  payload.writeUInt16BE(0xbeef, 0);
  payload.writeUInt16BE(0x0003, 2);
  payload.writeUInt16BE(0x0004, 4);
  payload.writeUInt16BE(0, 6);
  return CoapPacketLib.generate({
    confirmable: true,
    code: '2.05',
    messageId,
    token: Buffer.from([9]),
    options: [{ name: 'Uri-Path', value: Buffer.from('Hello') }],
    payload,
  });
}

describe('Device inbound CoAP', () => {
  function minimalDevice(): Device {
    const socket = {} as Socket;
    return new Device(socket, 'test-key', {} as Handshake);
  }

  it('routeMessage peels every PDU from the frame and forwards to routeParsedPacket in order', () => {
    const pkt1 = CoapPacketLib.generate({
      confirmable: true,
      code: '2.05',
      messageId: 100,
      token: Buffer.from([0]),
      options: [{ name: 'Uri-Path', value: Buffer.from('a') }],
      payload: Buffer.from([]),
    });
    const pkt2 = CoapPacketLib.generate({
      confirmable: true,
      code: '2.05',
      messageId: 200,
      token: Buffer.from([0]),
      options: [{ name: 'Uri-Path', value: Buffer.from('b') }],
      payload: Buffer.from([]),
    });

    const combined = Buffer.concat([pkt1, pkt2]);

    expect(CoapMessages.unwrapPdus(combined)).toHaveLength(2);

    const device = minimalDevice();
    const routeSpy = jest
      .spyOn(device, 'routeParsedPacket')
      .mockImplementation((): undefined => undefined);

    device.routeMessage(combined);

    expect(routeSpy).toHaveBeenCalledTimes(2);
    expect(routeSpy.mock.calls[0][0].messageId).toBe(100);
    expect(routeSpy.mock.calls[1][0].messageId).toBe(200);

    routeSpy.mockRestore();
  });

  it('_getHello applies receive counter and decodes protobuf-style hello payload bytes', () => {
    const device = minimalDevice();

    const wire = helloWireWithPayload(12345);
    const parsed = CoapPacketLib.parse(wire);

    const helloInfo =
      /** test access to underscore-prefixed method */
      (
        device as unknown as {
          _getHello: (p: CoapPacket) => { particleProductId: number };
        }
      )._getHello(parsed);

    expect((device as unknown as { _receiveCounter: number })._receiveCounter).toBe(
      12345,
    );
    expect(helloInfo.particleProductId).toBe(0xbeef);
  });

  it('startHandshake unwraps the buffer, applies Hello from the first PDU, and routes the rest', async () => {
    const pkt1 = CoapPacketLib.generate({
      confirmable: true,
      code: '2.05',
      messageId: 100,
      token: Buffer.from([0]),
      options: [{ name: 'Uri-Path', value: Buffer.from('a') }],
      payload: Buffer.from([]),
    });
    const pkt2 = CoapPacketLib.generate({
      confirmable: true,
      code: '2.05',
      messageId: 200,
      token: Buffer.from([0]),
      options: [{ name: 'Uri-Path', value: Buffer.from('b') }],
      payload: Buffer.from([]),
    });
    const handshakeBuffer = Buffer.concat([pkt1, pkt2]);

    expect(CoapMessages.unwrapPdus(handshakeBuffer)).toHaveLength(2);

    const device = minimalDevice();
    jest.spyOn(device, 'disconnect').mockImplementation((): undefined => undefined);
    const routeSpy = jest
      .spyOn(device, 'routeParsedPacket')
      .mockImplementation((): undefined => undefined);

    (device as unknown as { _handshake: { start: () => Promise<HandshakeStartResult> } })._handshake =
      {
        start: (): Promise<HandshakeStartResult> =>
          Promise.resolve({
            cipherStream: {},
            decipherStream: {},
            deviceID: 'unit-device',
            handshakeBuffer,
          }),
      };

    const deviceId = await device.startHandshake();

    expect(deviceId).toBe('unit-device');
    expect(routeSpy).toHaveBeenCalledTimes(1);
    expect(routeSpy.mock.calls[0][0].messageId).toBe(200);
    expect((device as unknown as { _receiveCounter: number })._receiveCounter).toBe(100);

    routeSpy.mockRestore();
  });

  it('startHandshake throws when handshake plaintext has no peelable CoAP PDU', async () => {
    const device = minimalDevice();

    jest.spyOn(device, 'disconnect').mockImplementation((): undefined => undefined);

    (device as unknown as { _handshake: { start: () => Promise<HandshakeStartResult> } })._handshake =
      {
        start: (): Promise<HandshakeStartResult> =>
          Promise.resolve({
            cipherStream: {},
            decipherStream: {},
            deviceID: 'unit-device',
            handshakeBuffer: Buffer.alloc(0),
          }),
      };

    await expect(device.startHandshake()).rejects.toThrow(
      'Handshake plaintext did not contain a parseable CoAP PDU',
    );
  });
});
