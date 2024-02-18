import type EventManager from '../managers/EventManager';
import type DeviceManager from '../managers/DeviceManager';

import Controller from './Controller';
import anonymous from '../decorators/anonymous';
import route from '../decorators/route';
import httpVerb from '../decorators/httpVerb';
import serverSentEvents from '../decorators/serverSentEvents';
import eventToApi from '../lib/eventToApi';
import Logger from '../lib/logger';
import { HttpResult } from './types';
import { ProtocolEvent } from '@brewskey/spark-protocol';

const logger = Logger.createModuleLogger(module);

const KEEP_ALIVE_INTERVAL = 9000;

class EventsController extends Controller {
  _eventManager: EventManager;

  _deviceManager: DeviceManager;

  _keepAliveIntervalID: string | null | undefined = null;

  _lastEventDate: Date = new Date();

  constructor(eventManager: EventManager, deviceManager: DeviceManager) {
    super();

    this._eventManager = eventManager;
    this._deviceManager = deviceManager;
  }

  @httpVerb('post')
  @route('/v1/ping')
  @anonymous()
  async ping(
    payload: Record<string, unknown>,
  ): Promise<HttpResult<Record<string, unknown> & { serverPayload: number }>> {
    return this.ok({
      ...payload,
      serverPayload: Math.random(),
    });
  }

  @httpVerb('get')
  @route('/v1/events/:eventNamePrefix?*')
  @serverSentEvents()
  async getEvents(eventNamePrefix?: string | null): Promise<void> {
    const subscriptionID = this._eventManager.subscribe(
      eventNamePrefix,
      this._pipeEvent.bind(this),
      this._getUserFilter(),
    );
    const keepAliveIntervalID = this._startKeepAlive();

    this._closeStream(subscriptionID, keepAliveIntervalID);
  }

  @httpVerb('get')
  @route('/v1/devices/events/:eventNamePrefix?*')
  @serverSentEvents()
  async getMyEvents(eventNamePrefix?: string | null): Promise<void> {
    const subscriptionID = this._eventManager.subscribe(
      eventNamePrefix,
      this._pipeEvent.bind(this),
      {
        mydevices: true,
        ...this._getUserFilter(),
      },
    );
    const keepAliveIntervalID = this._startKeepAlive();

    this._closeStream(subscriptionID, keepAliveIntervalID);
  }

  @httpVerb('get')
  @route('/v1/devices/:deviceIDorName/events/:eventNamePrefix?*')
  @serverSentEvents()
  async getDeviceEvents(
    deviceIDorName: string,
    eventNamePrefix?: string | null,
  ): Promise<void> {
    const deviceID = await this._deviceManager.getDeviceID(deviceIDorName);
    const subscriptionID = this._eventManager.subscribe(
      eventNamePrefix,
      this._pipeEvent.bind(this),
      {
        deviceID,
        ...this._getUserFilter(),
      },
    );
    const keepAliveIntervalID = this._startKeepAlive();

    this._closeStream(subscriptionID, keepAliveIntervalID);
  }

  @httpVerb('post')
  @route('/v1/devices/events')
  async publish(postBody: {
    name: string;
    data?: string;
    private: boolean;
    ttl?: number;
  }): Promise<HttpResult<{ ok: true }>> {
    const eventData: ProtocolEvent<string | undefined> = {
      data: postBody.data,
      isPublic: !postBody.private,
      name: postBody.name,
      ttl: postBody.ttl,
      publishedAt: new Date(),
      isInternal: false,
      ...this._getUserFilter(),
    };

    this._eventManager.publish(eventData);
    return this.ok({ ok: true });
  }

  _closeStream(subscriptionID: string, keepAliveIntervalID: NodeJS.Timeout) {
    const closeStreamHandler = () => {
      this._eventManager.unsubscribe(subscriptionID);
      clearInterval(keepAliveIntervalID);
    };

    this.request.on('close', closeStreamHandler);
    this.request.on('end', closeStreamHandler);
    this.response.on('finish', closeStreamHandler);
    this.response.on('end', closeStreamHandler);
  }

  _getUserFilter(): { userID?: string } {
    return this.user.role === 'administrator' ? {} : { userID: this.user.id };
  }

  _startKeepAlive(): NodeJS.Timeout {
    return setInterval(() => {
      if (Date.now() - this._lastEventDate.getTime() >= KEEP_ALIVE_INTERVAL) {
        this.response.write('\n');
        this._updateLastEventDate();
      }
    }, KEEP_ALIVE_INTERVAL);
  }

  async _pipeEvent(event: ProtocolEvent<unknown>) {
    try {
      this.response.write(`event: ${event.name || ''}\n`);
      this.response.write(`data: ${JSON.stringify(eventToApi(event))}\n\n`);
      this._updateLastEventDate();
    } catch (error) {
      logger.error(
        { deviceID: event.deviceID, err: error, event },
        'pipeEvents - write error',
      );
      throw error;
    }
  }

  _updateLastEventDate() {
    this._lastEventDate = new Date();
  }
}

export default EventsController;
