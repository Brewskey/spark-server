import { DeviceAttributes } from './entity/DeviceAttributes.entity';

export type ProtocolEvent<TEventContextData> = {
  connectionID?: string | null | undefined;
  context?: TEventContextData;
  data?: string | null | undefined;
  deviceID?: string | null | undefined;
  name: string;
  ttl?: number;
  userID?: number;
  broadcasted?: boolean;
  publishedAt: Date;
  isPublic: boolean;
  isInternal: boolean;
};

export type FunctionEventContext = {
  responseEventName: string;
  deviceID: string;
  functionArguments: Record<string, string>;
  functionName: string;
};

export type FlashEventContext = {
  deviceID: string;
  fileBuffer: Buffer;
  responseEventName: string;
  fileName: string;
  productID: number;
};
export type AttributesEventContext = {
  deviceID: string;
  responseEventName: string;
  attributes: DeviceAttributes;
};
export type VariableEventContext = {
  deviceID: string;
  responseEventName: string;
  variableName: string;
};
export type PingEventContext = {
  deviceID: string;
  responseEventName: string;
};
export type ShouldShowSignalEventContext = {
  deviceID: string;
  responseEventName: string;
  shouldShowSignal: boolean;
};
export type ResultEventContext = {
  result: string | number | boolean | Buffer | null | undefined;
};

export type PublishOptions = {
  isInternal?: boolean;
  isPublic?: boolean;
};
