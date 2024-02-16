import EventPublisher from './EventPublisher';
import type { ProtocolEvent } from '../types';

class EventProvider {
  _eventPublisher: EventPublisher;

  constructor(eventPublisher: EventPublisher) {
    this._eventPublisher = eventPublisher;
  }

  onNewEvent<TEventContextData>(
    callback: (event: ProtocolEvent<TEventContextData>) => void,
    eventNamePrefix: string = '*',
  ) {
    this._eventPublisher.subscribe(
      eventNamePrefix,
      this._onNewEvent(callback),
      {
        filterOptions: {
          listenToBroadcastedEvents: false,
          listenToInternalEvents: false,
        },
      },
    );
  }

  _onNewEvent<TEventContextData>(
    callback: (event: ProtocolEvent<TEventContextData>) => void,
  ): (event: ProtocolEvent<TEventContextData>) => Promise<void> {
    return async (event: ProtocolEvent<TEventContextData>) => {
      const eventToBroadcast: ProtocolEvent<TEventContextData> = {
        ...event,
      };

      callback(eventToBroadcast);
    };
  }
}

export default EventProvider;
