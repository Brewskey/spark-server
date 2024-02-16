// https://github.com/spark/firmware/blob/develop/communication/src/protocol_defs.h#L21-L55
const ProtocolErrors: Array<[number, string]> = [
  [0, 'NO_ERROR'],
  [1, 'PING_TIMEOUT'],
  [2, 'IO_ERROR'], // too generic, discontinue using this.  Perfer/add a specific one below
  [3, 'INVALID_STATE'],
  [4, 'INSUFFICIENT_STORAGE'],
  [5, 'MALFORMED_MESSAGE'],
  [6, 'DECRYPTION_ERROR'],
  [7, 'ENCRYPTION_ERROR'],
  [8, 'AUTHENTICATION_ERROR'],
  [9, 'BANDWIDTH_EXCEEDED'],
  [10, 'MESSAGE_TIMEOUT'],
  [11, 'MISSING_MESSAGE_ID'],
  [12, 'MESSAGE_RESET'],
  [13, 'SESSION_RESUMED'],
  [14, 'IO_ERROR_FORWARD_MESSAGE_CHANNEL'],
  [15, 'IO_ERROR_SET_DATA_MAX_EXCEEDED'],
  [16, 'IO_ERROR_PARSING_SERVER_PUBLIC_KEY'],
  [17, 'IO_ERROR_GENERIC_ESTABLISH'],
  [18, 'IO_ERROR_GENERIC_RECEIVE'],
  [19, 'IO_ERROR_GENERIC_SEND'],
  [20, 'IO_ERROR_GENERIC_MBEDTLS_SSL_WRITE'],
  [21, 'IO_ERROR_DISCARD_SESSION'],
  [21, 'IO_ERROR_LIGHTSSL_BLOCKING_SEND'],
  [22, 'IO_ERROR_LIGHTSSL_BLOCKING_RECEIVE'],
  [23, 'IO_ERROR_LIGHTSSL_RECEIVE'],
  [24, 'IO_ERROR_LIGHTSSL_HANDSHAKE_NONCE'],
  [25, 'IO_ERROR_LIGHTSSL_HANDSHAKE_RECV_KEY'],

  /*
   * NOTE: when adding more ProtocolError codes,
   * be sure to update toSystemError() in protocol_defs.cpp
   */
  [0x7ffff, 'UNKNOWN'],
];

const OUTPUT: Map<number, string> = new Map(ProtocolErrors);
export default OUTPUT;
