import type { EventData, EventPublisher, ProtocolEvent } from 'spark-protocol';

type FilterOptions = {
  connectionID?: string | null | undefined;
  deviceID?: string;
  listenToBroadcastedEvents?: boolean;
  listenToInternalEvents?: boolean;
  mydevices?: boolean;
  userID?: string;
};

class EventManager {
  _eventPublisher: EventPublisher;

  constructor(eventPublisher: EventPublisher) {
    this._eventPublisher = eventPublisher;
  }

  subscribe<TEventContextData>(
    eventNamePrefix: string | null | undefined,
    eventHandler: (event: ProtocolEvent<TEventContextData>) => Promise<void>,
    filterOptions: FilterOptions,
  ): string {
    return this._eventPublisher.subscribe(eventNamePrefix || '', eventHandler, {
      filterOptions,
    });
  }

  unsubscribe(subscriptionID: string) {
    this._eventPublisher.unsubscribe(subscriptionID);
  }

  publish<TEventContextData>(eventData: EventData<TEventContextData>) {
    this._eventPublisher.publish(eventData);
  }
}

export default EventManager;
