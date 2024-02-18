import EventEmitter from 'events';
import * as uuid from 'uuid';
import type { EventData, ProtocolEvent, PublishOptions } from '../types';
import settings from '../settings';
import nullthrows from 'nullthrows';

export const getRequestEventName = (eventName: string): string =>
  `${eventName}/request`;

const LISTEN_FOR_RESPONSE_TIMEOUT = 15000;

type FilterOptions = {
  connectionID?: string | null | undefined;
  deviceID?: string;
  listenToBroadcastedEvents?: boolean;
  listenToInternalEvents?: boolean;
  mydevices?: boolean;
  userID?: string;
};

type SubscriptionOptions = {
  filterOptions?: FilterOptions;
  once?: boolean;
  subscriberID?: string;
  subscriptionTimeout?: number;
  timeoutHandler?: () => void;
};

type Subscription<TEventContextData> = {
  eventNamePrefix: string;
  id: string;
  listener: (event: ProtocolEvent<TEventContextData>) => void;
  options: SubscriptionOptions;
};

class EventPublisher extends EventEmitter {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _subscriptionsByID: Map<string, Subscription<any>> = new Map();

  publish<TEventContextData>(
    eventData: EventData<TEventContextData>,
    options?: PublishOptions | null,
  ) {
    const ttl =
      eventData.ttl && eventData.ttl > 0
        ? eventData.ttl
        : settings.DEFAULT_EVENT_TTL;

    const event: ProtocolEvent<TEventContextData> = {
      ...eventData,
      publishedAt: new Date(),
      isInternal: options?.isInternal || false,
      isPublic: options?.isPublic || false,
      ttl,
    };

    setImmediate(() => {
      this._emitWithPrefix(eventData.name, event);
      this.emit('*', event);
    });
  }

  async publishAndListenForResponse<TEventResponseData, TEventContextData>(
    eventData: EventData<TEventContextData>,
  ): Promise<TEventResponseData & { error?: Error | undefined }> {
    const eventID = uuid.v4();
    const requestEventName = `${getRequestEventName(
      eventData.name,
    )}/${eventID}`;
    const responseEventName = `${eventData.name}/response/${eventID}`;

    return new Promise(
      (
        resolve: (
          event: TEventResponseData & { error: Error | undefined },
        ) => void,
        reject: (error: Error) => void,
      ) => {
        const responseListener = async (
          event: ProtocolEvent<
            TEventResponseData & { error: Error | undefined }
          >,
        ): Promise<void> => resolve(nullthrows(event.context));

        this.subscribe(responseEventName, responseListener, {
          once: true,
          subscriptionTimeout: LISTEN_FOR_RESPONSE_TIMEOUT,
          timeoutHandler: (): void =>
            reject(new Error(`Response timeout for event: ${eventData.name}`)),
        });

        this.publish(
          {
            ...eventData,
            context: {
              ...eventData.context,
              responseEventName,
            },
            name: requestEventName,
          },
          {
            isInternal: true,
            isPublic: false,
          },
        );
      },
    );
  }

  subscribe<TEventContextData, TResponse>(
    eventNamePrefix: string,
    eventHandler: (
      event: ProtocolEvent<TEventContextData>,
    ) => Promise<TResponse>,
    options: SubscriptionOptions = {},
  ): string {
    const { filterOptions, once, subscriptionTimeout, timeoutHandler } =
      options;

    let subscriptionID = uuid.v4();
    while (this._subscriptionsByID.has(subscriptionID)) {
      subscriptionID = uuid.v4();
    }

    const listener = filterOptions
      ? this._filterEvents(eventHandler, filterOptions)
      : eventHandler;

    const subscription: Subscription<TEventContextData> = {
      eventNamePrefix,
      id: subscriptionID,
      listener,
      options,
    };
    this._subscriptionsByID.set(subscriptionID, subscription);

    if (subscriptionTimeout) {
      const timeout = setTimeout(() => {
        this.unsubscribe(subscriptionID);
        if (timeoutHandler) {
          timeoutHandler();
        }
      }, subscriptionTimeout);
      this.once(eventNamePrefix, (): void => clearTimeout(timeout));
    }

    if (once) {
      this.once(eventNamePrefix, (event) => {
        this._subscriptionsByID.delete(subscriptionID);
        listener(event);
      });
    } else {
      this.on(eventNamePrefix, listener);
    }
    return subscriptionID;
  }

  unsubscribe(subscriptionID: string) {
    const subscription: Subscription<unknown> | null | undefined =
      this._subscriptionsByID.get(subscriptionID);
    if (!subscription) {
      return;
    }
    this.removeListener(subscription.eventNamePrefix, subscription.listener);
    this._subscriptionsByID.delete(subscriptionID);
  }

  unsubscribeBySubscriberID(subscriberID: string) {
    this._subscriptionsByID.forEach((subscription) => {
      if (subscription.options.subscriberID === subscriberID) {
        this.unsubscribe(subscription.id);
      }
    });
  }

  _emitWithPrefix<TEventContextData>(
    eventName: string,
    event: ProtocolEvent<TEventContextData>,
  ) {
    this.eventNames()
      .filter((eventNamePrefix: string | symbol): boolean =>
        eventName.startsWith(eventNamePrefix.toString()),
      )
      .forEach((eventNamePrefix: string | symbol): boolean =>
        this.emit(eventNamePrefix.toString(), event),
      );
  }

  _filterEvents<TEventContextData, TResponse>(
    eventHandler: (
      event: ProtocolEvent<TEventContextData>,
    ) => Promise<TResponse>,
    filterOptions: FilterOptions,
  ): (event: ProtocolEvent<TEventContextData>) => void {
    return (event: ProtocolEvent<TEventContextData>) => {
      if (event.isInternal && filterOptions.listenToInternalEvents === false) {
        return;
      }
      // filter private events from another devices
      if (
        filterOptions.userID &&
        !event.isPublic &&
        filterOptions.userID !== event.userID
      ) {
        return;
      }

      // filter private events with wrong connectionID
      if (
        !event.isPublic &&
        filterOptions.connectionID &&
        event.connectionID !== filterOptions.connectionID
      ) {
        return;
      }

      // filter mydevices events
      if (filterOptions.mydevices && filterOptions.userID !== event.userID) {
        return;
      }

      // filter event by deviceID
      if (filterOptions.deviceID && event.deviceID !== filterOptions.deviceID) {
        return;
      }

      // filter broadcasted events
      if (
        filterOptions.listenToBroadcastedEvents === false &&
        event.broadcasted
      ) {
        return;
      }

      process.nextTick(async (): Promise<TResponse> => eventHandler(event));
    };
  }
}

export default EventPublisher;
