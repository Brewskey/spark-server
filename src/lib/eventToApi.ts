import { ProtocolEvent } from 'spark-protocol';

export type EventAPIType = {
  coreid: string | null | undefined;
  data: string | null | undefined;
  published_at: Date;
  ttl: number;
};

const eventToApi = (event: ProtocolEvent<unknown>): EventAPIType => ({
  coreid: event.deviceID || null,
  data: event.data || null,
  published_at: event.publishedAt,
  ttl: event.ttl || 0,
});

export default eventToApi;
