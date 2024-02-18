import sinon from 'sinon';
import TestData from './setup/TestData';

import EventPublisher from '../lib/EventPublisher';
import { getRequestEventName } from '../lib/EventPublisher';
import { ProtocolEvent } from '../types';
import nullthrows from 'nullthrows';

const delay = (milliseconds: number) =>
  new Promise(
    (resolve: (_: void) => void): NodeJS.Timeout =>
      setTimeout(resolve, milliseconds),
  );

// todo fix this if find better approach
// we use delay to ensure events being published by eventPublisher
// the method has its caveats, obvious one: hardcoded delay is bad.
// and not obvious: we run tests in parallel so, if delay will be
// too small but there is huge amount of tests, some of them could fail
// because of that.
const DELAY_TIME = 100;

const TEST_EVENT_NAME = 'testEvent';

describe('EventPublisher', () => {
  test('should subscribe to event', async () => {
    const eventPublisher = new EventPublisher();
    const handler = sinon.spy();
    const eventData = {
      name: TEST_EVENT_NAME,
      userID: TestData.getID(),
    } as const;

    eventPublisher.subscribe(eventData.name, handler, {
      filterOptions: { userID: eventData.userID },
    });

    eventPublisher.publish(eventData);

    await delay(DELAY_TIME);
    expect(handler.called).toBeTruthy();
  });

  test('should listen for public event from another owner device', async () => {
    const eventPublisher = new EventPublisher();
    const handler = sinon.spy();
    const eventData = {
      name: TEST_EVENT_NAME,
      userID: TestData.getID(),
    } as const;

    eventPublisher.subscribe(eventData.name, handler, {
      filterOptions: { userID: TestData.getID() },
    });

    eventPublisher.publish(eventData, { isPublic: true });

    await delay(DELAY_TIME);
    expect(handler.called).toBeTruthy();
  });

  test('should filter private event', async () => {
    const eventPublisher = new EventPublisher();
    const handler = sinon.spy();
    const eventData = {
      name: TEST_EVENT_NAME,
      userID: TestData.getID(),
    } as const;

    eventPublisher.subscribe(eventData.name, handler, {
      filterOptions: { userID: TestData.getID() },
    });

    eventPublisher.publish(eventData, { isPublic: false });

    await delay(DELAY_TIME);
    expect(handler.called).toBeFalsy();
  });

  test('should filter internal event', async () => {
    const eventPublisher = new EventPublisher();
    const handler = sinon.spy();
    const eventData = {
      name: TEST_EVENT_NAME,
    } as const;

    eventPublisher.subscribe(eventData.name, handler, {
      filterOptions: { listenToInternalEvents: false },
    });

    eventPublisher.publish(eventData, { isInternal: true });

    await delay(DELAY_TIME);
    expect(handler.called).toBeFalsy();
  });

  test('should filter event by connectionID', async () => {
    const eventPublisher = new EventPublisher();
    const handler = sinon.spy();
    const connectionID = '123';
    const eventData = {
      name: TEST_EVENT_NAME,
      userID: TestData.getID(),
    } as const;

    eventPublisher.subscribe(eventData.name, handler, {
      filterOptions: { connectionID },
    });

    eventPublisher.publish(eventData, { isPublic: false });

    await delay(DELAY_TIME);
    expect(handler.called).toBeFalsy();
  });

  test('should filter event by deviceID', async () => {
    const eventPublisher = new EventPublisher();
    const handler = sinon.spy();
    const ownerID = TestData.getID();
    const deviceEvent = {
      name: TEST_EVENT_NAME,
      userID: ownerID,
      deviceID: TestData.getID(),
    } as const;

    // event from api or webhook-response
    const notDeviceEvent = {
      name: TEST_EVENT_NAME,
      userID: ownerID,
    } as const;

    eventPublisher.subscribe(deviceEvent.name, handler, {
      filterOptions: {
        deviceID: TestData.getID(),
        userID: deviceEvent.userID,
      },
    });

    eventPublisher.publish(deviceEvent, { isPublic: false });
    eventPublisher.publish(notDeviceEvent, { isPublic: false });

    await delay(DELAY_TIME);
    expect(handler.called).toBeFalsy();
  });

  test('should filter broadcasted events', async () => {
    const eventPublisher = new EventPublisher();
    const handler = sinon.spy();
    const ownerID = TestData.getID();
    const deviceEvent = {
      broadcasted: true,
      deviceID: TestData.getID(),
      name: TEST_EVENT_NAME,
      userID: ownerID,
    } as const;

    eventPublisher.subscribe(deviceEvent.name, handler, {
      filterOptions: {
        listenToBroadcastedEvents: false,
      },
    });

    eventPublisher.publish(deviceEvent, { isPublic: false });

    await delay(DELAY_TIME);
    expect(handler.called).toBeFalsy();
  });

  test('should listen for mydevices events only', async () => {
    const eventPublisher = new EventPublisher();
    const handler = sinon.spy();
    const ownerID = TestData.getID();

    const myDevicePublicEvent = {
      name: TEST_EVENT_NAME,
      userID: ownerID,
      deviceID: TestData.getID(),
    } as const;

    const myDevicesPrivateEvent = {
      name: TEST_EVENT_NAME,
      userID: ownerID,
      deviceID: TestData.getID(),
    } as const;

    const anotherOwnerPublicEvent = {
      name: TEST_EVENT_NAME,
      userID: TestData.getID(),
      deviceID: TestData.getID(),
    } as const;

    eventPublisher.subscribe(TEST_EVENT_NAME, handler, {
      filterOptions: {
        mydevices: true,
        userID: ownerID,
      },
    });

    eventPublisher.publish(myDevicePublicEvent, { isPublic: true });
    await delay(DELAY_TIME);
    expect(handler.callCount).toEqual(1);

    eventPublisher.publish(myDevicesPrivateEvent, { isPublic: false });
    await delay(DELAY_TIME);
    expect(handler.callCount).toEqual(2);

    eventPublisher.publish(anotherOwnerPublicEvent, { isPublic: true });
    await delay(DELAY_TIME);
    expect(handler.callCount).toEqual(2);
  });

  test('should unsubscribe all subscriptions by subscriberID', async () => {
    const eventPublisher = new EventPublisher();
    const handler = sinon.spy();
    const subscriberID = TestData.getID();

    const event = {
      name: TEST_EVENT_NAME,
    } as const;

    eventPublisher.subscribe(event.name, handler, { subscriberID });

    eventPublisher.subscribe(event.name, handler, { subscriberID });

    eventPublisher.publish(event, { isPublic: true });

    await delay(DELAY_TIME);
    expect(handler.callCount).toEqual(2);

    eventPublisher.unsubscribeBySubscriberID(subscriberID);
    eventPublisher.publish(event, { isPublic: true });

    await delay(DELAY_TIME);
    expect(handler.callCount).toEqual(2);
  });

  test('should publish and listen for response', async () => {
    const eventPublisher = new EventPublisher();
    const subscriberID = TestData.getID();
    const testContextData = '123';

    const responseHandler = async (
      event: ProtocolEvent<{ data: unknown; responseEventName: string }>,
    ) => {
      const { data, responseEventName } = nullthrows(event.context);

      eventPublisher.publish({
        name: responseEventName,
        context: data,
      });
    };

    eventPublisher.subscribe(
      getRequestEventName(TEST_EVENT_NAME),
      responseHandler,
      { subscriberID },
    );

    const response = await eventPublisher.publishAndListenForResponse({
      name: TEST_EVENT_NAME,
      context: { data: testContextData },
    });

    expect(response).toEqual(testContextData);
  });
});
