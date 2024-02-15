import { Container } from 'constitute';
import fs from 'fs';
import http from 'http';
import https from 'https';
import os from 'os';
import { filterFalsyValues, type DeviceServer } from 'spark-protocol';
import createApp from './app';
import defaultBindings from './defaultBindings';
import settings from './settings';
import Logger from './lib/logger';
import nullthrows from 'nullthrows';

const logger = Logger.createModuleLogger(module);

const NODE_PORT = process.env.NODE_PORT || settings.EXPRESS_SERVER_CONFIG.PORT;

process.on('uncaughtException', (exception: Error) => {
  logger.error({ err: exception }, 'uncaughtException');
  process.exit(1); // exit with failure
});

/* This is the container used app-wide for dependency injection. If you want to
 * override any of the implementations, create your module with the new
 * implementation and use:
 *
 * container.bindAlias(DefaultImplementation, MyNewImplementation);
 *
 * You can also set a new value
 * container.bindAlias(DefaultValue, 12345);
 *
 * See https://github.com/justmoon/constitute for more info
 */
const container = new Container();
defaultBindings(container, settings);

const deviceServer = container.constitute<DeviceServer>('DeviceServer');
deviceServer.start();

const app = createApp(container, settings);

const onServerStartListen = () => {
  logger.info({ port: NODE_PORT }, 'Express server started, with events');
};

const {
  SSL_PRIVATE_KEY_FILEPATH: privateKeyFilePath,
  SSL_CERTIFICATE_FILEPATH: certificateFilePath,
  USE_SSL: useSSL,
  ...expressConfig
} = settings.EXPRESS_SERVER_CONFIG;

if (useSSL) {
  logger.debug(
    { cert: certificateFilePath, key: privateKeyFilePath },
    'Use SSL',
  );
  const options = {
    cert:
      (certificateFilePath &&
        fs.readFileSync(nullthrows(certificateFilePath))) ??
      undefined,
    key:
      (privateKeyFilePath && fs.readFileSync(nullthrows(privateKeyFilePath))) ??
      undefined,
    ...expressConfig,
  } as const;
  https.createServer(options, app).listen(NODE_PORT, onServerStartListen);
} else {
  http.createServer(app).listen(NODE_PORT, onServerStartListen);
}

const addresses = Object.entries(os.networkInterfaces())
  .map(([_name, nic]) =>
    nic
      ?.filter(
        (address): boolean =>
          address.family === 'IPv4' && address.address !== '127.0.0.1',
      )
      .map((address): string => address.address),
  )
  .filter(filterFalsyValues)
  .flat();
addresses.forEach((address: string): void =>
  logger.info({ address }, 'Server IP address found'),
);
