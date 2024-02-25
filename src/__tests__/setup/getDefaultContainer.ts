import { Container } from 'constitute';
import { DataSource } from 'typeorm';

import defaultBindings from '../../defaultBindings';
import DeviceServerMock from './DeviceServerMock';
import settings from './settings';

export default (dataSource: DataSource): Container => {
  const container = new Container();
  container.bindValue('DataSource', dataSource);

  defaultBindings(container, settings);

  // settings
  container.bindValue('DEVICE_DIRECTORY', settings.DEVICE_DIRECTORY);
  container.bindValue('FIRMWARE_DIRECTORY', settings.FIRMWARE_DIRECTORY);
  container.bindValue('SERVER_KEY_FILENAME', settings.SERVER_KEY_FILENAME);
  container.bindValue('SERVER_KEYS_DIRECTORY', settings.SERVER_KEYS_DIRECTORY);
  container.bindValue('USERS_DIRECTORY', settings.USERS_DIRECTORY);
  container.bindValue('WEBHOOKS_DIRECTORY', settings.WEBHOOKS_DIRECTORY);

  container.bindAlias('DeviceServer', DeviceServerMock);
  return container;
};
