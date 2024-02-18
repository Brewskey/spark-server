import chalk from 'chalk';
import fs from 'fs';
import nullthrows from 'nullthrows';
import Particle from 'particle-api-js';
import readline from 'readline';
import testWebhook from './test-webhook.json';
import path from 'path';

import CryptoManager from './lib/CryptoManager';
import TCPDevice from './devices/TCPDevice';

type ReadlineInterface = {
  close: () => void;
  question: (question: string, callback: (answer: string) => void) => void;
};

type ConfigData = {
  configs: Array<Config>;
  defaultConfigIndex: number;
};

type Config = {
  serverKeyPath: string;
  serverPort: number;
  serverUrl: string;
};

const USERNAME = '__test__@testaccount.com';
const PASSWORD = 'password';
const PARTICLE_API_CONFIG = {
  clientId: 'particle-collider',
  clientSecret: 'particle-collider',
};

const FOLDER_PATH = path.join(process.cwd(), 'data/');
const CONFIG_FILE_PATH = path.join(FOLDER_PATH, 'configs.json');

const formatOption = (
  key: string | number,
  description: string,
  strikeThrough?: number | boolean,
) => {
  if (strikeThrough) {
    return;
  }

  console.log(`${chalk.bgYellow.black(key)} ${description}`);
};

class App {
  _accessToken!: string;
  _configData!: ConfigData;
  _devices: Array<TCPDevice> = [];
  _existingDeviceIDs: Array<string> = [];
  _exit: boolean = false;
  _functionInterval!: NodeJS.Timeout | null;
  _particle!: Particle;
  _rl: ReadlineInterface;
  _variableInterval!: NodeJS.Timeout | null;
  _webhookInterval!: NodeJS.Timeout | null;

  constructor() {
    console.log(
      '    ____             __  _      __        ______      _____     __         \n   / __ \\____ ______/ /_(_)____/ /__     / ____/___  / / (_)___/ /__  _____\n  / /_/ / __ `/ ___/ __/ / ___/ / _ \\   / /   / __ \\/ / / / __  / _ \\/ ___/\n / ____/ /_/ / /  / /_/ / /__/ /  __/  / /___/ /_/ / / / / /_/ /  __/ /    \n/_/    \\__,_/_/   \\__/_/\\___/_/\\___/   \\____/\\____/_/_/_/\\__,_/\\___/_/     \n                                                                           \n',
    );

    this._rl = readline.createInterface({ input: process.stdin });
  }

  run = async (): Promise<void> => {
    this._setupData();

    let config = this._getConfig();
    if (!config) {
      config = await this._setupNewConfig();
    }
    try {
      await this._setup(config);
    } catch (error) {
      console.error(error);
      console.log();
      console.log();
      config = await this._setupNewConfig();
      await this._setup(config);
    }
    while (!this._exit) {
      const connectedDeviceCount = this._devices.filter((device) =>
        device.getIsConnected(),
      ).length;
      console.log('');
      console.log(
        chalk.green(
          `${connectedDeviceCount} of ${this._devices.length} virtual ` +
            `devices currently connected`,
        ),
      );
      console.log(chalk.green(`${this._existingDeviceIDs.length} claimed`));

      this._renderMenu();

      const answer = await this._question();
      switch (answer) {
        case '1': {
          await this._createDevices(config);
          break;
        }

        case '2': {
          await this._stopDevices();
          break;
        }

        case '3': {
          await this._setDefaultConfig();
          config = nullthrows(this._getConfig());
          await this._setup(config);
          break;
        }

        case '4': {
          config = await this._setupNewConfig();
          break;
        }

        case '5': {
          await this._callFunctions();
          break;
        }

        case '6': {
          await this._callVariables();
          break;
        }

        case '7': {
          await this._callWebhooks();
          break;
        }

        case '8': {
          await this._chaosMonkey();
          break;
        }

        case 's': {
          this._clearIntervals();

          break;
        }

        case 'e': {
          await this._stopDevices();
          this._clearIntervals();
          this._exit = true;
          break;
        }
      }
    }

    this._rl.close();
  };

  _clearIntervals = (): void => {
    if (this._functionInterval != null) {
      clearInterval(this._functionInterval);
    }
    if (this._variableInterval != null) {
      clearInterval(this._variableInterval);
    }
    if (this._webhookInterval != null) {
      clearInterval(this._webhookInterval);
    }
    this._functionInterval = null;
    this._variableInterval = null;
    this._webhookInterval = null;
  };

  _setup = async (config: Config): Promise<void> => {
    this._setServerKey(config);
    await this._login(config);
    await this._setupWebhooks(config);

    this._existingDeviceIDs = fs
      .readdirSync(path.join(process.cwd(), `data/keys`))
      .map((file) => path.parse(file).name);
  };

  _renderMenu(): void {
    console.log('');
    console.log('Choose an option:');
    formatOption(1, 'Start Virtual Device(s)');
    formatOption(2, 'Stop Virtual Device(s)');
    formatOption(3, 'Set default config');
    formatOption(4, 'Create new config');
    formatOption(
      5,
      'Call random device functions',
      this._functionInterval != null,
    );
    formatOption(
      6,
      'Get random device variables',
      this._variableInterval != null,
    );
    formatOption(7, 'Call random webhooks', this._webhookInterval != null);
    formatOption(
      8,
      'Chaos-Monkey -- run all the things!',
      this._functionInterval != null &&
        this._variableInterval != null &&
        this._webhookInterval != null,
    );

    if (
      this._functionInterval ||
      this._variableInterval ||
      this._webhookInterval
    ) {
      formatOption('s', 'Stop random calls');
    }

    formatOption('e', 'Exit');
    console.log('');
  }

  _setupNewConfig = async (): Promise<Config> => {
    const config: Config = {
      serverKeyPath: '',
      serverPort: 8080,
      serverUrl: '',
    };

    const getServerKey = async (): Promise<void> => {
      console.log(
        'In order to connect the virtual Particle devices, we need the ' +
          'public key to your local cloud server. What is the relative or ' +
          'absolute path to your server key?\r\n\r\nIt looks like ' +
          'server-key.pub.pem\r\n',
      );
      const serverKeyPath = await this._question();

      if (!fs.existsSync(serverKeyPath)) {
        console.log(`Could not find the server key at ${serverKeyPath}`);
        await getServerKey();
        return;
      }

      config.serverKeyPath = serverKeyPath;
    };

    const getServerUrl = async (): Promise<void> => {
      console.log('Now we need the host name or IP address of your server.');
      console.log(
        'It can look like 192.168.0.175 or https://cloud.particle.io',
      );
      const serverUrl = await this._question();
      config.serverUrl = serverUrl;
    };

    const getServerPort = async (): Promise<void> => {
      console.log('What is your server port? Default is 8080');
      const port = await this._question();

      if (port && isNaN(Number(port))) {
        await getServerPort();
      }

      config.serverPort = port ? parseInt(port, 10) : config.serverPort;
    };

    await getServerKey();
    await getServerUrl();
    await getServerPort();

    console.log('Your server config has been correctly set.');

    this._configData.configs.push(config);
    this._configData.defaultConfigIndex = this._configData.configs.length - 1;

    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(this._configData));

    await this._setup(config);

    return config;
  };

  _setDefaultConfig = async (): Promise<void> => {
    console.log('Pick a default config');
    const configs = this._configData.configs;
    configs.map((config, index) =>
      console.log(`${chalk.green(index + 1)} ${config.serverUrl}`),
    );
    const answer = await this._question();
    if (!answer) {
      return;
    }

    if (isNaN(Number(answer))) {
      console.log('Input must be a number');
      await this._setDefaultConfig();
      return;
    }

    const configIndex = parseInt(answer, 10) - 1;
    if (configIndex < 0 || configIndex >= configs.length) {
      console.log('Not a valid config.');
      await this._setDefaultConfig();
      return;
    }

    if (this._configData.defaultConfigIndex !== configIndex) {
      this._killDevices(this._devices.length);
    }

    this._configData.defaultConfigIndex = configIndex;
    this._saveConfig();
  };

  _createDevices = async (config: Config): Promise<void> => {
    console.log('How many devices do you want to create?');
    const amountString = await this._question();

    if (isNaN(Number(amountString))) {
      return;
    }

    const amount = parseInt(amountString, 10);
    for (let ii = 0; ii < amount; ii++) {
      const index = this._devices.length;
      let deviceID =
        this._existingDeviceIDs.length > index
          ? this._existingDeviceIDs[index]
          : null;

      if (
        deviceID &&
        !fs.existsSync(path.join(process.cwd(), `data/keys/${deviceID}.pem`))
      ) {
        this._existingDeviceIDs.splice(ii, 1);
        deviceID = null;
      }

      const device = new TCPDevice({
        deviceID,
        // Simulate devices that take longer to send data
        networkDelay: Math.floor(Math.random() * 1000),
        serverAddress: config.serverUrl,
      });

      // If the device doesn't already exist, we need to send the key and
      // claim the device.
      if (!deviceID) {
        deviceID = device.getDeviceID();
        this._existingDeviceIDs.push(deviceID);
        await this._particle.sendPublicKey({
          auth: this._accessToken,
          deviceId: deviceID,
          key: device.getPublicKey(),
        });
      }

      console.log(`Adding ${this._devices.length}: ${deviceID}`);
      this._devices.push(device);
    }

    this._devices
      .filter((device) => !device.getIsConnected())
      .map((device) => device.connect());

    console.time('Time To Connect Devices');
    new Promise((resolve: (_: void) => void) =>
      setInterval(() => {
        if (this._devices.every((device) => device.getIsConnected())) {
          resolve();
        }
      }),
    ).then(() => console.timeEnd('Time To Connect Devices'));
  };

  _stopDevices = async (): Promise<void> => {
    console.log('How many devices do you want to stop?');
    const amountString = await this._question();

    if (isNaN(Number(amountString))) {
      return;
    }

    let amount = parseInt(amountString, 10);
    this._killDevices(amount);
  };

  _killDevices(amount: number): void {
    const idsToAdd = [];
    while (amount) {
      amount -= 1;
      const index = Math.floor(Math.random() * this._devices.length);
      const device = this._devices[index];
      if (!device) {
        continue;
      }
      const deviceID = device.getDeviceID();
      this._devices = this._devices.filter(
        (device) => device.getDeviceID() !== deviceID,
      );
      idsToAdd.push(deviceID);
      this._existingDeviceIDs = this._existingDeviceIDs.filter(
        (id) => id !== deviceID,
      );

      device.disconnect();
    }

    console.log(this._devices.length);

    this._existingDeviceIDs = this._existingDeviceIDs.concat(idsToAdd);
  }

  _login = async (config: Config): Promise<void> => {
    this._particle = new Particle({
      ...PARTICLE_API_CONFIG,
      baseUrl: config.serverUrl + `:${config.serverPort}`,
    });

    const credentials = {
      password: PASSWORD,
      username: USERNAME,
    };
    const login = () => this._particle.login(credentials);
    let loginData = null;
    try {
      loginData = await login();
    } catch (error) {}

    if (!loginData) {
      await this._particle.createUser(credentials);
      loginData = await login();
    }

    this._accessToken = loginData.body.access_token;
  };

  // Runs server actions with 10% of devices
  _runServerAction(
    callback: (device: TCPDevice) => void,
  ): NodeJS.Timeout | null {
    if (!this._devices.length) {
      console.log();
      console.log(chalk.red("You don't have any devices running. Start some"));
      return null;
    }

    const INTERVAL = 5000;
    const callAction = () => {
      let devices = this._devices.filter((device) => device.getIsConnected());
      devices = devices.slice(0, Math.ceil(devices.length * 0.1));
      devices.forEach((device) =>
        setTimeout(() => callback(device), Math.random() * INTERVAL),
      );
    };

    callAction();
    return setInterval(callAction, INTERVAL);
  }

  _callFunctions = async (): Promise<void> => {
    if (this._functionInterval) {
      return;
    }

    this._functionInterval = this._runServerAction((device) =>
      this._particle.callFunction({
        auth: this._accessToken,
        deviceId: device.getDeviceID(),
        name: 'testFn',
        argument: Math.random(),
      }),
    );
  };

  _callVariables = async (): Promise<void> => {
    if (this._variableInterval) {
      return;
    }

    this._variableInterval = this._runServerAction((device) =>
      this._particle.getVariable({
        auth: this._accessToken,
        deviceId: device.getDeviceID(),
        name: 'testVar',
      }),
    );
  };

  _callWebhooks = async (): Promise<void> => {
    if (this._webhookInterval) {
      return;
    }

    this._webhookInterval = this._runServerAction((device) =>
      device.sendWebhook(),
    );
  };

  _chaosMonkey = async (): Promise<void> => {
    this._callFunctions();
    this._callVariables();
    this._callWebhooks();
  };

  _setupWebhooks = async (config: Config): Promise<void> => {
    const webhooks = await this._particle.listWebhooks({
      auth: this._accessToken,
    });
    if (webhooks && webhooks.body.length) {
      const promises = webhooks.body.map((webhook) =>
        this._particle.deleteWebhook({
          auth: this._accessToken,
          hookId: webhook.id,
        }),
      );
      await Promise.all(promises);
    }

    let pingUrl = config.serverUrl.replace(/(^\w+:|^)\/\//, '');

    await this._particle.createWebhook({
      ...testWebhook,
      auth: this._accessToken,
      url: `${config.serverPort === 443 ? 'https' : 'http'}://${pingUrl}:${config.serverPort}/v1/ping1`,
    });
  };

  _question = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      this._rl.question('', (answer) => resolve(answer));
    });
  };

  _setupData(): void {
    if (!fs.existsSync(FOLDER_PATH)) {
      fs.mkdirSync(FOLDER_PATH);
    }

    if (!fs.existsSync(`${FOLDER_PATH}/keys`)) {
      fs.mkdirSync(`${FOLDER_PATH}/keys`);
    }

    if (!fs.existsSync(CONFIG_FILE_PATH)) {
      this._configData = {
        configs: [
          {
            serverKeyPath: '../../../data/default_key.pub.pem',
            serverPort: 8080,
            serverUrl: 'http://localhost',
          },
        ],
        defaultConfigIndex: 0,
      };
      this._saveConfig();
    } else {
      this._configData = JSON.parse(fs.readFileSync(CONFIG_FILE_PATH, 'utf8'));
    }
  }

  _getConfig(): Config | null {
    const { configs, defaultConfigIndex } = this._configData;
    if (defaultConfigIndex === -1 || defaultConfigIndex >= configs.length) {
      return null;
    }
    return configs[defaultConfigIndex];
  }

  _setServerKey(config: Config): void {
    const keyString = fs.readFileSync(
      path.join(FOLDER_PATH, config.serverKeyPath),
      'utf8',
    );
    CryptoManager.setServerKey(keyString);
  }

  _saveConfig(): void {
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(this._configData));
  }
}

export default App;
