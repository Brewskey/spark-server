// @flow

import { EventPublisher, ALL_EVENTS } from 'spark-protocol';
import type { Event } from '../types';

class EventProvider {
  _eventPublisher: EventPublisher;

  constructor(eventPublisher: EventPublisher) {
    this._eventPublisher = eventPublisher;
  }

  onNewEvent = (callback: (event: Event) => void): void =>
    this._eventPublisher.subscribe(ALL_EVENTS, callback);
}

export default EventProvider;
