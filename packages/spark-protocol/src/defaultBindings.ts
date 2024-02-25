import type { Container } from 'constitute';
import { DataSource } from 'typeorm';

import { DeviceAttributes } from './entity/DeviceAttributes.entity';
import { DeviceKeyObject } from './entity/DeviceKeyObject.entity';
import { ProductDevice } from './entity/ProductDevice.entity';
import { ProductFirmware } from './entity/ProductFirmware.entity';
import ClaimCodeManager from './lib/ClaimCodeManager';
import CryptoManager from './lib/CryptoManager';
import EventProvider from './lib/EventProvider';
import EventPublisher from './lib/EventPublisher';
import FirmwareManager from './lib/FirmwareManager';
import { DeviceAttributeRepository } from './repository/DeviceAttributeRepository';
import { DeviceKeyObjectRepository } from './repository/DeviceKeyObjectRepository';
import { ProductDeviceRepository } from './repository/ProductDeviceRepository';
import { ProductFirmwareRepository } from './repository/ProductFirmwareRepository';
import ServerKeyFileRepository from './repository/ServerKeyFileRepository';
import DeviceServer, { DeviceServerConfig } from './server/DeviceServer';
import protocolSettings from './settings';

type ProtocolSettings = {
  BINARIES_DIRECTORY?: string;
  CONNECTED_DEVICES_LOGGING_INTERVAL: number;
  DEVICE_DIRECTORY: string;
  SERVER_KEY_FILENAME: string;
  SERVER_KEY_PASSWORD?: string;
  SERVER_KEYS_DIRECTORY: string;
  TCP_DEVICE_SERVER_CONFIG: DeviceServerConfig;
};

const defaultBindings = (
  container: Container,
  serverSettings: ProtocolSettings,
) => {
  const mergedSettings = { ...protocolSettings, ...serverSettings } as const;
  FirmwareManager.initialize(mergedSettings.BINARIES_DIRECTORY);

  // Settings
  container.bindValue('DEVICE_DIRECTORY', mergedSettings.DEVICE_DIRECTORY);
  container.bindValue(
    'CONNECTED_DEVICES_LOGGING_INTERVAL',
    mergedSettings.CONNECTED_DEVICES_LOGGING_INTERVAL,
  );
  container.bindValue(
    'SERVER_KEY_FILENAME',
    mergedSettings.SERVER_KEY_FILENAME,
  );
  container.bindValue(
    'SERVER_KEY_PASSWORD',
    mergedSettings.SERVER_KEY_PASSWORD,
  );
  container.bindValue(
    'SERVER_KEYS_DIRECTORY',
    mergedSettings.SERVER_KEYS_DIRECTORY,
  );
  container.bindValue(
    'TCP_DEVICE_SERVER_CONFIG',
    mergedSettings.TCP_DEVICE_SERVER_CONFIG,
  );
  container.bindValue(
    'ALLOW_DEVICE_TO_PROVIDE_PEM',
    mergedSettings.ALLOW_DEVICE_TO_PROVIDE_PEM,
  );

  const dataSource = container.constitute<DataSource>('DataSource');
  [
    {
      entity: DeviceAttributes,
      repository: DeviceAttributeRepository,
    },
    {
      entity: DeviceKeyObject,
      repository: DeviceKeyObjectRepository,
    },
    {
      entity: ProductDevice,
      repository: ProductDeviceRepository,
    },
    {
      entity: ProductFirmware,
      repository: ProductFirmwareRepository,
    },
  ].forEach(({ entity, repository }) => {
    const repositoryKey = entity.name + '.Repository';
    container.bindValue(repositoryKey, dataSource.getRepository(entity));
    container.bindClass(repository.name, repository, [repositoryKey]);
  });

  container.bindClass('ServerKeyRepository', ServerKeyFileRepository, [
    'SERVER_KEYS_DIRECTORY',
    'SERVER_KEY_FILENAME',
  ]);

  // Utils
  container.bindClass('EventPublisher', EventPublisher, []);
  container.bindClass('EVENT_PROVIDER', EventProvider, ['EventPublisher']);
  container.bindClass('ClaimCodeManager', ClaimCodeManager, []);
  container.bindClass('CryptoManager', CryptoManager, [
    'DeviceKeyObjectRepository',
    'ServerKeyRepository',
    'SERVER_KEY_PASSWORD',
  ]);

  // Device server
  container.bindClass('DeviceServer', DeviceServer, [
    'DeviceAttributeRepository',
    'ProductDeviceRepository',
    'ProductFirmwareRepository',
    'ClaimCodeManager',
    'CryptoManager',
    'EventPublisher',
    'TCP_DEVICE_SERVER_CONFIG',
    'CONNECTED_DEVICES_LOGGING_INTERVAL',
    'ALLOW_DEVICE_TO_PROVIDE_PEM',
  ]);
};

export default defaultBindings;
