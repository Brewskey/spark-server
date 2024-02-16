import hogan from 'hogan.js';
import type { CoapMessageTypes } from './CoapMessage';

import CoapMessage from './CoapMessage';

export type MessageSpecificationType = {
  code: number;
  response?: string | null | undefined;
  template?: hogan.Template | null | undefined;
  type: CoapMessageTypes;
  uri?: string | null | undefined;
};

export type MessageType =
  | 'Hello'
  | 'KeyChange'
  | 'UpdateBegin'
  | 'UpdateAbort'
  | 'Chunk'
  | 'ChunkMissed'
  | 'UpdateDone'
  | 'FunctionCall'
  | 'VariableRequest'
  | 'PrivateEvent'
  | 'PublicEvent'
  | 'Subscribe'
  | 'Describe'
  | 'GetTime'
  | 'SignalStart'
  | 'EventAck'
  | 'EventSlowdown'
  | 'SubscribeAck'
  | 'SubscribeFail'
  | 'GetTimeReturn'
  | 'SignalStartReturn'
  | 'ChunkMissedAck'
  | 'DescribeReturn'
  | 'KeyChanged'
  | 'UpdateReady'
  | 'ChunkReceived'
  | 'ChunkReceivedError'
  | 'FunctionReturn'
  | 'FunctionReturnError'
  | 'VariableValue'
  | 'VariableValueError'
  | 'Ping'
  | 'PingAck'
  | 'SocketPing';

const INITIAL_MESSAGE_SPECIFICATIONS: Array<
  [MessageType, MessageSpecificationType]
> = [
  [
    'Hello',
    {
      code: CoapMessage.Code.POST,
      response: 'Hello',
      type: CoapMessage.Type.NON,
      uri: 'h',
    },
  ],
  [
    'KeyChange',
    {
      code: CoapMessage.Code.PUT,
      response: 'KeyChanged',
      type: CoapMessage.Type.CON,
      uri: 'k',
    },
  ],
  [
    'UpdateBegin',
    {
      code: CoapMessage.Code.POST,
      response: 'UpdateReady',
      type: CoapMessage.Type.CON,
      uri: 'u',
    },
  ],
  [
    'UpdateAbort',
    {
      code: CoapMessage.Code.BAD_REQUEST,
      type: CoapMessage.Type.NON,
    },
  ],
  [
    'Chunk',
    {
      code: CoapMessage.Code.POST,
      response: 'ChunkReceived',
      type: CoapMessage.Type.CON,
      uri: 'c',
    },
  ],
  [
    'ChunkMissed',
    {
      code: CoapMessage.Code.GET,
      response: 'ChunkMissedAck',
      type: CoapMessage.Type.CON,
      uri: 'c',
    },
  ],
  [
    'UpdateDone',
    {
      code: CoapMessage.Code.PUT,
      response: null,
      type: CoapMessage.Type.CON,
      uri: 'u',
    },
  ],
  [
    'FunctionCall',
    {
      code: CoapMessage.Code.POST,
      response: 'FunctionReturn',
      type: CoapMessage.Type.CON,
      uri: 'f/{{name}}',
    },
  ],
  [
    'VariableRequest',
    {
      code: CoapMessage.Code.GET,
      response: 'VariableValue',
      type: CoapMessage.Type.CON,
      uri: 'v/{{name}}',
    },
  ],

  [
    'PrivateEvent',
    {
      code: CoapMessage.Code.POST,
      response: null,
      type: CoapMessage.Type.NON,
      uri: 'E/{{event_name}}',
    },
  ],
  [
    'PublicEvent',
    {
      code: CoapMessage.Code.POST,
      response: null,
      type: CoapMessage.Type.NON,
      uri: 'e/{{event_name}}',
    },
  ],
  [
    'Subscribe',
    {
      code: CoapMessage.Code.GET,
      response: null,
      type: CoapMessage.Type.CON,
      uri: 'e/{{event_name}}',
    },
  ],
  [
    'Describe',
    {
      code: CoapMessage.Code.GET,
      response: 'DescribeReturn',
      type: CoapMessage.Type.CON,
      uri: 'd',
    },
  ],
  [
    'GetTime',
    {
      code: CoapMessage.Code.GET,
      response: 'GetTimeReturn',
      type: CoapMessage.Type.CON,
      uri: 't',
    },
  ],
  [
    'SignalStart',
    {
      code: CoapMessage.Code.PUT,
      response: 'SignalStartReturn',
      type: CoapMessage.Type.CON,
      uri: 's',
    },
  ],
  // 'PrivateSubscribe': {
  //   code: CoapMessage.Code.GET,
  //   uri: 'E/{{event_name}}',
  //   type: CoapMessage.Type.NON,
  //   response: null
  // },
  [
    'EventAck',
    {
      code: CoapMessage.Code.EMPTY,
      response: null,
      type: CoapMessage.Type.ACK,
      uri: null,
    },
  ],
  [
    'EventSlowdown',
    {
      code: CoapMessage.Code.BAD_REQUEST,
      response: null,
      type: CoapMessage.Type.ACK,
      uri: null,
    },
  ],
  [
    'SubscribeAck',
    {
      code: CoapMessage.Code.EMPTY,
      response: null,
      type: CoapMessage.Type.ACK,
      uri: null,
    },
  ],
  [
    'SubscribeFail',
    {
      code: CoapMessage.Code.BAD_REQUEST,
      response: null,
      type: CoapMessage.Type.ACK,
      uri: null,
    },
  ],
  [
    'GetTimeReturn',
    {
      code: CoapMessage.Code.CONTENT,
      type: CoapMessage.Type.ACK,
    },
  ],
  [
    'SignalStartReturn',
    {
      code: CoapMessage.Code.CHANGED,
      type: CoapMessage.Type.ACK,
    },
  ],
  [
    'ChunkMissedAck',
    {
      code: CoapMessage.Code.EMPTY,
      type: CoapMessage.Type.ACK,
    },
  ],
  [
    'DescribeReturn',
    {
      code: CoapMessage.Code.CHANGED,
      type: CoapMessage.Type.NON,
    },
  ],
  [
    'KeyChanged',
    {
      code: CoapMessage.Code.CHANGED,
      type: CoapMessage.Type.NON,
    },
  ],
  [
    'UpdateReady',
    {
      code: CoapMessage.Code.CHANGED,
      type: CoapMessage.Type.NON,
    },
  ],
  [
    'ChunkReceived',
    {
      code: CoapMessage.Code.CHANGED,
      type: CoapMessage.Type.NON,
    },
  ],
  [
    'ChunkReceivedError',
    {
      code: CoapMessage.Code.BAD_REQUEST,
      type: CoapMessage.Type.NON,
    },
  ],
  [
    'FunctionReturn',
    {
      code: CoapMessage.Code.CHANGED,
      type: CoapMessage.Type.NON,
    },
  ],
  [
    'FunctionReturnError',
    {
      code: CoapMessage.Code.BAD_REQUEST,
      type: CoapMessage.Type.NON,
    },
  ],
  [
    'VariableValue',
    {
      code: CoapMessage.Code.CONTENT,
      type: CoapMessage.Type.ACK,
    },
  ],
  [
    'VariableValueError',
    {
      code: CoapMessage.Code.BAD_REQUEST,
      type: CoapMessage.Type.NON,
    },
  ],
  [
    'Ping',
    {
      code: CoapMessage.Code.EMPTY,
      type: CoapMessage.Type.CON,
    },
  ],
  [
    'PingAck',
    {
      code: CoapMessage.Code.EMPTY,
      response: null,
      type: CoapMessage.Type.ACK,
      uri: null,
    },
  ],
  [
    'SocketPing',
    {
      code: CoapMessage.Code.EMPTY,
      type: CoapMessage.Type.NON,
    },
  ],
];

const MessageSpecifications: Array<[MessageType, MessageSpecificationType]> =
  INITIAL_MESSAGE_SPECIFICATIONS.map(
    ([name, value]: [MessageType, MessageSpecificationType]) => {
      let template: hogan.Template | undefined;
      if (value && value.uri && value.uri.indexOf('{') >= 0) {
        template = hogan.compile(value.uri);
      }

      return [name, { ...value, template }];
    },
  );

export default MessageSpecifications;
