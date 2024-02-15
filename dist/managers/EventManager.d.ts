import type { EventData, EventPublisher, ProtocolEvent } from 'spark-protocol';
type FilterOptions = {
    connectionID?: string | null | undefined;
    deviceID?: string;
    listenToBroadcastedEvents?: boolean;
    listenToInternalEvents?: boolean;
    mydevices?: boolean;
    userID?: string;
};
declare class EventManager {
    _eventPublisher: EventPublisher;
    constructor(eventPublisher: EventPublisher);
    subscribe<TEventContextData>(eventNamePrefix: string | null | undefined, eventHandler: (event: ProtocolEvent<TEventContextData>) => Promise<void>, filterOptions: FilterOptions): string;
    unsubscribe(subscriptionID: string): void;
    publish<TEventContextData>(eventData: EventData<TEventContextData>): void;
}
export default EventManager;
