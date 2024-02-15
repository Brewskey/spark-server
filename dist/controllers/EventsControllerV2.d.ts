/// <reference types="node" />
import type EventManager from '../managers/EventManager';
import type DeviceManager from '../managers/DeviceManager';
import Controller from './Controller';
import { HttpResult } from './types';
import { ProtocolEvent } from 'spark-protocol';
declare class EventsControllerV2 extends Controller {
    _eventManager: EventManager;
    _deviceManager: DeviceManager;
    _keepAliveIntervalID: string | null | undefined;
    _lastEventDate: Date;
    constructor(eventManager: EventManager, deviceManager: DeviceManager);
    ping(payload: Record<string, unknown>): Promise<HttpResult<Record<string, unknown> & {
        serverPayload: number;
    }>>;
    getEvents(eventNamePrefix?: string | null): void;
    getMyEvents(eventNamePrefix?: string | null): void;
    getDeviceEvents(deviceIDorName: string, eventNamePrefix?: string | null): Promise<void>;
    publish(postBody: {
        name: string;
        data?: string;
        private: boolean;
        ttl?: number;
    }): Promise<HttpResult<{
        ok: true;
    }>>;
    _closeStream(subscriptionID: string, keepAliveIntervalID: NodeJS.Timeout): void;
    _getUserFilter(): {
        userID?: string;
    };
    _startKeepAlive(): NodeJS.Timeout;
    _pipeEvent(event: ProtocolEvent<unknown>): Promise<void>;
    _updateLastEventDate(): void;
}
export default EventsControllerV2;
