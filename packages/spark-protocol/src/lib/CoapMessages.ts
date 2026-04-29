import type { ParsedPacket, Option, NamedOption } from 'coap-packet';
import CoapPacket from 'coap-packet';
import type { CoapMessageTypes } from './CoapMessage';
import type {
  MessageSpecificationType,
  MessageType,
} from './MessageSpecifications';

import CoapMessage from './CoapMessage';
import MessageSpecifications from './MessageSpecifications';
import Logger from './logger';
import { filterFalsyValues } from '../filterFalsyValues';
const logger = Logger.createModuleLogger(module);

const getRouteKey = (code: number | string, path: string): string => {
  const uri = code + path;
  const idx = uri.indexOf('/');

  // this assumes all the messages are one character for now.
  // if we wanted to change this, we'd need to find the first non message char,
  // '/' or '?', or use the real coap parsing stuff
  return uri.substr(0, idx + 2);
};
const messageTypeToPacketProps = (
  type: CoapMessageTypes,
): {
  ack: boolean;
  confirmable: boolean;
  reset: boolean;
} => {
  const output = {
    ack: false,
    confirmable: false,
    reset: false,
  };
  const types = CoapMessage.Type;
  if (type === types.ACK) {
    output.ack = true;
  } else if (type === types.CON) {
    output.confirmable = true;
  } else if (type === types.RST) {
    output.reset = true;
  }

  return output;
};

const decodeNumericValue = (buffer: Buffer): number => {
  const { length } = buffer;
  if (length === 0) {
    return 0;
  }
  if (length === 1) {
    return buffer[0];
  }
  if (length === 2) {
    return buffer.readUInt16BE(0);
  }
  if (length === 3) {
    /* eslint-disable no-bitwise */
    return (buffer[1] << 8) | (buffer[2] + ((buffer[0] << 16) >>> 0));
    /* eslint-enable no-bitwise */
  }

  return buffer.readUInt32BE(0);
};

/** RFC 7252: version bits (top two) === 01 for protocol version 1. */
const isCoapVersion1HeaderByte = (b: number): boolean =>
  ((b >>> 6) & 3) === 1;

const wireFromParsed = (packet: ParsedPacket): Buffer =>
  CoapPacket.generate({
    ack: !!packet.ack,
    confirmable: !!packet.confirmable,
    reset: !!packet.reset,
    code: String(packet.code),
    messageId: packet.messageId ?? 0,
    token: packet.token ?? Buffer.alloc(0),
    options: (packet.options ?? []) as Option[],
    payload: packet.payload ?? Buffer.alloc(0),
  });

/** True iff `buf` equals `generate(parsed)` for coap-packet (strict left-segment / whole-buffer checks). */
const bufferMatchesParsedWire = (buf: Buffer, parsed: ParsedPacket): boolean => {
  const encoded = wireFromParsed(parsed);
  return encoded.length === buf.length && encoded.compare(buf) === 0;
};

/**
 * Consume the first CoAP PDU starting at `start`.
 * - Prefer a minimal parse that cannot extend by one byte (true single PDU prefix).
 * - Otherwise, if the rest is one canonical wire PDU, take the whole slice.
 * - Else try a split at a CoAP v1-looking byte (glued `[p‖q]` blobs from coap-packet mis-parse).
 */
const peelFirstCoapPdu = (
  data: Buffer,
  start: number,
): { packet: ParsedPacket; consumed: number } | null => {
  const upper = data.length;
  const lower = start + 4;

  if (lower > upper) {
    return null;
  }

  /* 1) Shortest prefix parse that fails if extended by one byte (true PDU end). */
  for (let end = lower; end < upper; end += 1) {
    let packet: ParsedPacket;
    try {
      packet = CoapPacket.parse(data.subarray(start, end));
    } catch {
      continue;
    }

    try {
      CoapPacket.parse(data.subarray(start, end + 1));
    } catch {
      return { packet, consumed: end - start };
    }
  }

  const restAll = data.subarray(start);

  let wholePkt: ParsedPacket | null = null;
  let canonOk = false;

  try {
    wholePkt = CoapPacket.parse(restAll);
    canonOk = bufferMatchesParsedWire(restAll, wholePkt);
  } catch {
    wholePkt = null;
  }

  if (!canonOk) {
    for (let split = upper - 4; split >= lower; split -= 1) {
      if (!isCoapVersion1HeaderByte(data[split])) {
        continue;
      }

      const leftBuf = data.subarray(start, split);

      try {
        const packet = CoapPacket.parse(leftBuf);
        if (!bufferMatchesParsedWire(leftBuf, packet)) {
          continue;
        }

        CoapPacket.parse(data.subarray(split));
        return { packet, consumed: split - start };
      } catch {
        continue;
      }
    }
  }

  if (canonOk && wholePkt) {
    return { packet: wholePkt, consumed: restAll.length };
  }

  try {
    return {
      packet: CoapPacket.parse(restAll),
      consumed: restAll.length,
    };
  } catch {
    return null;
  }
};

class CoapMessages {
  static _specifications: Map<MessageType, MessageSpecificationType> = new Map(
    MessageSpecifications,
  );

  // Maps CODE + URL to MessageNames as they appear in 'Spec'
  static _routes: Map<string, MessageType> = new Map(
    MessageSpecifications.filter(
      // eslint-disable-next-line no-unused-vars
      ([_name, value]): boolean => !!value.uri,
    ).map(([name, value]): [string, MessageType] => {
      // see what it looks like without params
      const uri = value.template ? value.template.render({}) : value.uri;
      const routeKey = getRouteKey(value.code, `/${uri || ''}`);

      return [routeKey, name];
    }),
  );

  static getUriPath(packet: ParsedPacket): string {
    const options = (packet.options || []).filter(
      (item): boolean => item.name === CoapMessage.Option.URI_PATH,
    );

    if (!options.length) {
      return '';
    }

    return `/${options
      .map((item): string => item.value.toString('utf8'))
      .join('/')}`;
  }

  static getUriQuery(packet: ParsedPacket): string {
    return (packet.options || [])
      .filter((item): boolean => item.name === CoapMessage.Option.URI_QUERY)
      .map((item): string => item.value.toString('utf8'))
      .join('&');
  }

  static getMaxAge(packet: ParsedPacket): number {
    const option = (packet.options || []).find(
      (item): boolean => item.name === CoapMessage.Option.MAX_AGE,
    );

    if (!option) {
      return 0;
    }

    return decodeNumericValue(option.value);
  }

  static getRequestType(packet: ParsedPacket): MessageType | undefined {
    const uri = getRouteKey(packet.code, CoapMessages.getUriPath(packet));

    return CoapMessages._routes.get(uri);
  }

  static getResponseType(name: MessageType): string | null | undefined {
    const specification = CoapMessages._specifications.get(name);
    return specification?.response;
  }

  static statusIsOkay(message: ParsedPacket): boolean {
    return parseFloat(message.code) < CoapMessage.Code.BAD_REQUEST;
  }

  static isNonTypeMessage(messageName: MessageType): boolean {
    const specification = CoapMessages._specifications.get(messageName);
    if (!specification) {
      return false;
    }

    return specification.type === CoapMessage.Type.NON;
  }

  static wrap(
    messageName: MessageType,
    messageId: number,
    params?: {
      args?: Array<string> | Array<Buffer>;
      name?: string;
      event_name?: string;
    } | null,
    options?: Array<Option> | null,
    data?: Buffer | null,
    token?: number | null,
  ): Buffer | null | undefined {
    try {
      const specification = CoapMessages._specifications.get(messageName);
      if (!specification) {
        logger.error(
          { err: new Error(messageName), messageName },
          'Unknown Message Type',
        );
        return null;
      }

      // Format our url
      let { uri } = specification;
      let queryParams: {
        name: string;
        value: Buffer;
      }[] = [];
      if (params) {
        if (specification.template) {
          uri = specification.template.render(params);
        }

        queryParams = (params.args || []).map((value) => {
          let newValue = null;
          if (Buffer.isBuffer(value)) {
            newValue = value;
          } else if (typeof value === 'number') {
            newValue = Buffer.alloc(value);
          } else {
            newValue = Buffer.from(value);
          }
          return {
            name: CoapMessage.Option.URI_QUERY,
            value: newValue,
          };
        });
      }

      let uriOptions: NamedOption[] = [];
      const hasExistingUri = (options || []).some(
        (item): boolean => item.name === CoapMessage.Option.URI_PATH,
      );

      if (uri && !hasExistingUri) {
        uriOptions = uri
          .split('/')
          .filter(filterFalsyValues)
          .map((segment: string) => ({
            name: CoapMessage.Option.URI_PATH,
            value: Buffer.from(segment),
          }));
      }

      return CoapPacket.generate({
        ...messageTypeToPacketProps(specification.type),
        code: specification.code.toString(),
        messageId,
        options: [...uriOptions, ...(options || []), ...queryParams].filter(
          filterFalsyValues,
        ),
        payload: data || Buffer.alloc(0),
        ...(token || token === 0
          ? {
              token: Buffer.from([token]),
            }
          : {}),
      });
    } catch (error) {
      logger.error({ err: error, messageName }, 'Coap Error');
    }
    return null;
  }

  /** One or more CoAP PDUs from plaintext (fixes concatenated PDU blobs / coap-packet eating the whole buffer). */
  static unwrapPdus(data: Buffer | null): ParsedPacket[] {
    if (!data || !data.length) {
      return [];
    }

    const out: ParsedPacket[] = [];
    let offset = 0;

    while (offset < data.length) {
      const peeled = peelFirstCoapPdu(data, offset);
      if (!peeled) {
        if (offset === 0) {
          logger.error({ dataLen: data.length }, 'Coap Error');
        }

        break;
      }

      out.push(peeled.packet);
      offset += peeled.consumed;
    }

    return out;
  }

  /** First CoAP PDU only (backward compatible). Prefer {@link unwrapPdus} for inbound device traffic. */
  static unwrap(data: Buffer): ParsedPacket | null | undefined {
    return CoapMessages.unwrapPdus(data)[0];
  }

  // http://en.wikipedia.org/wiki/X.690
  // === TYPES: SUBSET OF ASN.1 TAGS ===
  //
  // 1: BOOLEAN (false=0, true=1)
  // 2: INTEGER (int32)
  // 4: OCTET STRING (arbitrary bytes)
  // 5: NULL (void for return value only)
  // 9: REAL (double)
  // Translates the integer variable type enum to user friendly string types
  static translateIntTypes(
    varState?: Record<string, number> | null,
  ): Record<string, string> | null | undefined {
    if (!varState) {
      return null;
    }
    const translatedVarState: Record<string, string> = {};

    Object.getOwnPropertyNames(varState).forEach((varName: string) => {
      let intType: string | number = varState?.[varName];

      if (typeof intType === 'number') {
        intType = CoapMessages.getNameFromTypeInt(intType);
      }
      translatedVarState[varName] = intType;
    });

    return translatedVarState;
  }

  static getNameFromTypeInt(typeInt: number): string {
    switch (typeInt) {
      case 1: {
        return 'bool';
      }

      case 2: {
        return 'int32';
      }

      case 4: {
        return 'string';
      }

      case 5: {
        return 'null';
      }

      case 9: {
        return 'double';
      }

      default: {
        logger.error(
          { err: new Error('asked for unknown type'), typeInt },
          'asked for unknown type',
        );
        throw new Error(`error getNameFromTypeInt: ${typeInt}`);
      }
    }
  }

  // eslint-disable-next-line func-names
  static tryFromBinary<TResult>(
    buffer: Buffer,
    typeName: string,
  ): TResult | null {
    let result = null;
    try {
      result = CoapMessages.fromBinary(buffer, typeName);
    } catch (error) {
      logger.error(
        { buffer: buffer.toString(), err: error, typeName },
        'Could not parse type',
      );
    }
    return result as unknown as TResult;
  }

  // eslint-disable-next-line func-names
  static fromBinary(
    buffer: Buffer,
    typeName: string,
  ): boolean | number | string | Buffer {
    switch (typeName.toLowerCase()) {
      case 'bool': {
        return !!buffer.readUInt8(0);
      }

      case 'byte': {
        return buffer.readUInt8(0);
      }

      case 'crc': {
        return buffer.readInt32BE(0);
      }

      case 'uint32': {
        return buffer.readUInt32BE(0);
      }

      case 'uint16': {
        return buffer.readUInt16BE(0);
      }

      case 'int':
      case 'int32':
      case 'number': {
        if (!buffer.length) {
          return 0;
        }

        return buffer.readIntBE(0, Math.min(4, buffer.length));
      }

      case 'float': {
        return buffer.readFloatBE(0);
      }

      case 'double': {
        // doubles on the device are little-endian
        return buffer.readDoubleLE(0);
      }

      case 'buffer': {
        return buffer;
      }

      case 'string':
      default: {
        return buffer.toString('utf8');
      }
    }
  }

  static toBinary(
    value?: string | number | Buffer | null,
    typeName?: string,
  ): Buffer {
    // eslint-disable-next-line no-param-reassign
    typeName = typeName || typeof value;

    if (value === null) {
      return Buffer.alloc(0);
    }

    switch (typeName) {
      case 'uint8': {
        const buffer = Buffer.allocUnsafe(1);
        buffer.writeUInt8(value as unknown as number, 0);
        return buffer;
      }
      case 'uint16': {
        const buffer = Buffer.allocUnsafe(2);
        buffer.writeUInt16BE(value as unknown as number, 0);
        return buffer;
      }
      case 'uint32':
      case 'crc': {
        const buffer = Buffer.allocUnsafe(4);
        buffer.writeUInt32BE(value as unknown as number, 0);
        return buffer;
      }

      case 'int32': {
        const buffer = Buffer.allocUnsafe(4);
        buffer.writeInt32BE(value as unknown as number, 0);
        return buffer;
      }

      case 'number':
      case 'double': {
        const buffer = Buffer.allocUnsafe(4);
        buffer.writeDoubleLE(value as unknown as number, 0);
        return buffer;
      }

      case 'buffer': {
        // TODO - THIS LOOKS LIKE A BUG
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return Buffer.concat([value as any]);
      }

      case 'string':
      default: {
        return Buffer.from(value?.toString() || '');
      }
    }
  }
}

export default CoapMessages;
