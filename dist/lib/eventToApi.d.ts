import { ProtocolEvent } from 'spark-protocol';
export type EventAPIType = {
    coreid: string | null | undefined;
    data: string | null | undefined;
    published_at: Date;
    ttl: number;
};
declare const eventToApi: (event: ProtocolEvent<unknown>) => EventAPIType;
export default eventToApi;
