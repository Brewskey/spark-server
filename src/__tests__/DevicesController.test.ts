import {
  DeviceAttributeRepository,
  DeviceAttributes,
  DeviceKeyObjectRepository,
  EventPublisher,
  SPARK_SERVER_EVENTS,
  User,
} from '@brewskey/spark-protocol';
import { Container } from 'constitute';
import nullthrows from 'nullthrows';
import sinon from 'sinon';
import request from 'supertest';
import { Repository } from 'typeorm';

import ouathClients from '../oauthClients.json';
import DeviceFirmwareFileRepository from '../repository/DeviceFirmwareFileRepository';
import UserRepository from '../repository/UserRepository';
import { AppAndContainer, createTestApp } from './setup/createTestApp';
import TestData from './setup/TestData';
import { getTestDataSource } from './setup/TestDataSource';

describe('DevicesController', () => {
  const dataSource = getTestDataSource();
  let app: AppAndContainer;
  let container: Container;
  let customFirmwareFilePath: string;

  const USER_CREDENTIALS = TestData.getUser();
  const USER_CREDENTIALS2 = TestData.getUser();
  const CONNECTED_DEVICE_ID = TestData.getID();
  const DISCONNECTED_DEVICE_ID = TestData.getID();
  let testUser: User;
  let userToken: string;
  let userToken2: string;
  let connectedDeviceToApiAttributes: Record<string, unknown>;
  let disconnectedDeviceToApiAttributes: Record<string, unknown>;
  let deviceAttributesRepository: Repository<DeviceAttributes>;

  const TEST_LAST_HEARD = new Date();
  const TEST_DEVICE_FUNCTIONS = ['testFunction'];
  const TEST_FUNCTION_ARGUMENT = 'testArgument';
  const TEST_DEVICE_VARIABLES = ['testVariable1', 'testVariable2'];
  const TEST_VARIABLE_RESULT = 'resultValue';

  beforeAll(async () => {
    await dataSource.initialize();
    app = createTestApp(dataSource);
    container = app.container;

    deviceAttributesRepository = container.constitute<
      Repository<DeviceAttributes>
    >('DeviceAttributes.Repository');

    sinon
      .stub(
        container.constitute<EventPublisher>('EventPublisher'),
        'publishAndListenForResponse',
      )
      .callsFake(
        async ({
          name,
          context: {
            deviceID,
            functionArguments,
            functionName,
            shouldShowSignal,
            variableName,
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }: any) => {
          if (name === SPARK_SERVER_EVENTS.PING_DEVICE) {
            return deviceID === CONNECTED_DEVICE_ID
              ? {
                  connected: true,
                  lastHeard: TEST_LAST_HEARD,
                }
              : {
                  connected: false,
                  lastHeard: null,
                };
          }

          if (deviceID !== CONNECTED_DEVICE_ID) {
            return { error: new Error('Could not get device for ID') };
          }

          if (name === SPARK_SERVER_EVENTS.CALL_DEVICE_FUNCTION) {
            if (TEST_DEVICE_FUNCTIONS.includes(functionName)) {
              return { result: functionArguments.argument };
            } else {
              return { error: new Error(`Unknown Function ${functionName}`) };
            }
          }

          if (name === SPARK_SERVER_EVENTS.GET_DEVICE_ATTRIBUTES) {
            return {
              deviceID: CONNECTED_DEVICE_ID,
              functions: TEST_DEVICE_FUNCTIONS,
              lastHeard: TEST_LAST_HEARD,
              ownerID: testUser.id,
              variables: TEST_DEVICE_VARIABLES,
            };
          }

          if (name === SPARK_SERVER_EVENTS.GET_DEVICE_VARIABLE_VALUE) {
            if (!TEST_DEVICE_VARIABLES.includes(variableName)) {
              throw new Error('Variable not found');
            }
            return { result: TEST_VARIABLE_RESULT };
          }

          if (name === SPARK_SERVER_EVENTS.FLASH_DEVICE) {
            return { status: 'Update finished' };
          }

          if (name === SPARK_SERVER_EVENTS.RAISE_YOUR_HAND) {
            return shouldShowSignal ? { status: 1 } : { status: 0 };
          }

          return { error: new Error('Should not happen') };
        },
      );
    const { filePath } = await TestData.createCustomFirmwareBinary();
    customFirmwareFilePath = filePath;

    await request(app).post('/v1/users').send(USER_CREDENTIALS);
    await request(app).post('/v1/users').send(USER_CREDENTIALS2);

    testUser = nullthrows(
      await container
        .constitute<UserRepository>('UserRepository')
        .getByUsernameOrFail(USER_CREDENTIALS.username),
    );

    const tokenResponse = await request(app)
      .post('/oauth/token')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        client_id: ouathClients[0].clientId,
        client_secret: ouathClients[0].clientSecret,
        grant_type: 'password',
        password: USER_CREDENTIALS.password,
        username: USER_CREDENTIALS.username,
      });

    userToken = tokenResponse.body.access_token;

    const tokenResponse2 = await request(app)
      .post('/oauth/token')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        client_id: ouathClients[0].clientId,
        client_secret: ouathClients[0].clientSecret,
        grant_type: 'password',
        password: USER_CREDENTIALS2.password,
        username: USER_CREDENTIALS2.username,
      });
    userToken2 = tokenResponse2.body.access_token;

    if (!userToken) {
      throw new Error('test user creation fails');
    }

    const provisionConnectedDeviceResponse = await request(app)
      .post(`/v1/provisioning/${CONNECTED_DEVICE_ID}`)
      .query({ access_token: userToken })
      .send({ publicKey: TestData.getPublicKey() });

    connectedDeviceToApiAttributes = provisionConnectedDeviceResponse.body;

    const provisionDisconnectedDeviceResponse = await request(app)
      .post(`/v1/provisioning/${DISCONNECTED_DEVICE_ID}`)
      .query({ access_token: userToken })
      .send({ publicKey: TestData.getPublicKey() });

    disconnectedDeviceToApiAttributes =
      provisionDisconnectedDeviceResponse.body;

    if (
      !connectedDeviceToApiAttributes.id ||
      !disconnectedDeviceToApiAttributes.id
    ) {
      throw new Error('test devices creation fails');
    }
  });

  test('should throw an error for compile source code endpoint', async () => {
    const response = await request(app)
      .post('/v1/binaries')
      .query({ access_token: userToken });

    expect(response.status).toEqual(400);
  });

  test('should return device details for connected device', async () => {
    const response = await request(app)
      .get(`/v1/devices/${CONNECTED_DEVICE_ID}`)
      .query({ access_token: userToken });

    expect(response.status).toEqual(200);
    expect(response.body.connected).toBeTruthy();
    expect(JSON.stringify(response.body.functions)).toEqual(
      JSON.stringify(TEST_DEVICE_FUNCTIONS),
    );
    expect(response.body.id).toEqual(connectedDeviceToApiAttributes.id);
    expect(response.body.name).toEqual(connectedDeviceToApiAttributes.name);
    expect(response.body.ownerID).toEqual(
      connectedDeviceToApiAttributes.ownerID,
    );
    expect(JSON.stringify(response.body.variables)).toEqual(
      JSON.stringify(TEST_DEVICE_VARIABLES),
    );
    expect(response.body.last_heard).toEqual(TEST_LAST_HEARD.toISOString());
  });

  test('should return device details for disconnected device', async () => {
    const response = await request(app)
      .get(`/v1/devices/${DISCONNECTED_DEVICE_ID}`)
      .query({ access_token: userToken });

    expect(response.status).toEqual(200);
    expect(response.body.connected).toEqual(false);
    expect(response.body.functions).toBeNull();
    expect(response.body.id).toEqual(disconnectedDeviceToApiAttributes.id);
    expect(response.body.name).toEqual(disconnectedDeviceToApiAttributes.name);
    expect(response.body.ownerID).toEqual(
      disconnectedDeviceToApiAttributes.ownerID,
    );
    expect(response.body.variables).toMatchObject({});
  });

  test('should throw an error if device not found', async () => {
    const response = await request(app)
      .get(`/v1/devices/${CONNECTED_DEVICE_ID}123`)
      .query({ access_token: userToken });

    expect(response.status).toEqual(404);
    expect(response.body.error).toEqual('Could not find DeviceAttributes');
  });

  test('should return all devices', async () => {
    const response = await request(app)
      .get('/v1/devices/')
      .query({ access_token: userToken });

    const devices = response.body;

    expect(response.status).toEqual(200);
    expect(Array.isArray(devices) && devices.length > 0).toBeTruthy();
  });

  test('should unclaim device', async () => {
    const unclaimResponse = await request(app)
      .delete(`/v1/devices/${DISCONNECTED_DEVICE_ID}`)
      .query({ access_token: userToken });

    expect(unclaimResponse.status).toEqual(200);
    expect(unclaimResponse.body.ok).toEqual(true);

    const getDeviceResponse = await request(app)
      .get(`/v1/devices/${DISCONNECTED_DEVICE_ID}`)
      .query({ access_token: userToken });

    expect(getDeviceResponse.status).toEqual(403);
  });

  test('should claim device', async () => {
    const claimDeviceResponse = await request(app)
      .post('/v1/devices')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        access_token: userToken,
        id: DISCONNECTED_DEVICE_ID,
      });

    expect(claimDeviceResponse.status).toEqual(200);
    expect(claimDeviceResponse.body.ok).toEqual(true);

    const getDeviceResponse = await request(app)
      .get(`/v1/devices/${DISCONNECTED_DEVICE_ID}`)
      .query({ access_token: userToken });

    expect(getDeviceResponse.status).toEqual(200);
  });

  test('should throw a error if device is already claimed by the user', async () => {
    const claimDeviceResponse = await request(app)
      .post('/v1/devices')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        access_token: userToken,
        id: CONNECTED_DEVICE_ID,
      });

    expect(claimDeviceResponse.status).toEqual(400);
    expect(claimDeviceResponse.body.error).toEqual(
      'The device is already claimed.',
    );
  });

  test('should throw an error if device belongs to somebody else', async () => {
    const claimDeviceResponse = await request(app)
      .post('/v1/devices')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        access_token: userToken2,
        id: CONNECTED_DEVICE_ID,
      });

    expect(claimDeviceResponse.status).toEqual(400);
    expect(claimDeviceResponse.body.error).toEqual(
      'The device belongs to someone else.',
    );
  });

  test('should return function call result and device attributes', async () => {
    const attributes = await deviceAttributesRepository.findOneByOrFail({
      deviceID: CONNECTED_DEVICE_ID,
    });
    await deviceAttributesRepository.save({
      ...attributes,
      isConnected: true,
    });
    const callFunctionResponse = await request(app)
      .post(`/v1/devices/${CONNECTED_DEVICE_ID}/${TEST_DEVICE_FUNCTIONS[0]}`)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        access_token: userToken,
        argument: TEST_FUNCTION_ARGUMENT,
      });

    expect(callFunctionResponse.status).toEqual(200);
    expect(callFunctionResponse.body.return_value).toEqual(
      TEST_FUNCTION_ARGUMENT,
    );
    expect(callFunctionResponse.body.connected).toEqual(true);
    expect(callFunctionResponse.body.id).toEqual(CONNECTED_DEVICE_ID);
  });

  test("should throw an error if function doesn't exist", async () => {
    const callFunctionResponse = await request(app)
      .post(
        `/v1/devices/${CONNECTED_DEVICE_ID}/wrong${TEST_DEVICE_FUNCTIONS[0]}`,
      )
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        access_token: userToken,
      });

    expect(callFunctionResponse.status).toEqual(404);
    expect(callFunctionResponse.body.error).toEqual('Function not found');
  });

  test('should return variable value', async () => {
    const getVariableResponse = await request(app)
      .get(`/v1/devices/${CONNECTED_DEVICE_ID}/${TEST_DEVICE_VARIABLES[0]}/`)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .query({ access_token: userToken });

    expect(getVariableResponse.status).toEqual(200);
    expect(getVariableResponse.body.result).toEqual(TEST_VARIABLE_RESULT);
  });

  test('should throw an error if variable not found', async () => {
    const getVariableResponse = await request(app)
      .get(
        `/v1/devices/${CONNECTED_DEVICE_ID}/wrong${TEST_DEVICE_VARIABLES[0]}/`,
      )
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .query({ access_token: userToken });

    expect(getVariableResponse.status).toEqual(404);
    expect(getVariableResponse.body.error).toEqual('Variable not found');
  });

  test('should rename device', async () => {
    const newDeviceName = 'newDeviceName';

    const renameDeviceResponse = await request(app)
      .put(`/v1/devices/${CONNECTED_DEVICE_ID}`)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        access_token: userToken,
        name: newDeviceName,
      });

    expect(renameDeviceResponse.status).toEqual(200);
    expect(renameDeviceResponse.body.name).toEqual(newDeviceName);
  });

  test('should invoke raise your hand on device', async () => {
    const raiseYourHandResponse = await request(app)
      .put(`/v1/devices/${CONNECTED_DEVICE_ID}`)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        access_token: userToken,
        signal: '1',
      });

    expect(raiseYourHandResponse.status).toEqual(200);
  });

  test('should throw an error if signal is wrong value', async () => {
    const raiseYourHandResponse = await request(app)
      .put(`/v1/devices/${CONNECTED_DEVICE_ID}`)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        access_token: userToken,
        signal: 'some wrong value',
      });

    expect(raiseYourHandResponse.status).toEqual(400);
    expect(raiseYourHandResponse.body.error).toEqual('Wrong signal value');
  });

  test('should start device flashing process with known application', async () => {
    const knownAppName = 'knownAppName';
    const knownAppBuffer = Buffer.from(knownAppName);

    const deviceFirmwareStub = sinon
      .stub(
        container.constitute<DeviceFirmwareFileRepository>(
          'DeviceFirmwareFileRepository',
        ),
        'getByName',
      )
      .returns(knownAppBuffer);

    const flashKnownAppResponse = await request(app)
      .put(`/v1/devices/${CONNECTED_DEVICE_ID}`)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        access_token: userToken,
        app_id: knownAppName,
      });
    deviceFirmwareStub.restore();

    expect(flashKnownAppResponse.status).toEqual(200);
    expect(flashKnownAppResponse.body.status).toEqual('Update finished');
    expect(flashKnownAppResponse.body.id).toEqual(CONNECTED_DEVICE_ID);
  });

  test('should throws an error if known application not found', async () => {
    const knownAppName = 'knownAppName';

    const flashKnownAppResponse = await request(app)
      .put(`/v1/devices/${CONNECTED_DEVICE_ID}`)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        access_token: userToken,
        app_id: knownAppName,
      });

    expect(flashKnownAppResponse.status).toEqual(404);
    expect(flashKnownAppResponse.body.error).toEqual(
      `No firmware ${knownAppName} found`,
    );
  });

  test('should start device flashing process with custom application', async () => {
    const flashCustomFirmwareResponse = await request(app)
      .put(`/v1/devices/${CONNECTED_DEVICE_ID}`)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .attach('file', customFirmwareFilePath)
      .query({ access_token: userToken });

    expect(flashCustomFirmwareResponse.status).toEqual(200);
    expect(flashCustomFirmwareResponse.body.status).toEqual('Update finished');
    expect(flashCustomFirmwareResponse.body.id).toEqual(CONNECTED_DEVICE_ID);
  });

  test('should throw an error if custom firmware file not provided', async () => {
    const flashCustomFirmwareResponse = await request(app)
      .put(`/v1/devices/${CONNECTED_DEVICE_ID}`)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .field('file_type', 'binary')
      .query({ access_token: userToken });

    expect(flashCustomFirmwareResponse.status).toEqual(400);
    expect(flashCustomFirmwareResponse.body.error).toEqual(
      'Firmware file not provided',
    );
  });

  test('should throw an error if custom firmware file type not binary', async () => {
    const flashCustomFirmwareResponse = await request(app)
      .put(`/v1/devices/${CONNECTED_DEVICE_ID}`)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      // send random not binary file
      .attach('file', __filename)
      .query({ access_token: userToken });

    expect(flashCustomFirmwareResponse.status).toEqual(400);
    expect(flashCustomFirmwareResponse.body.error).toEqual(
      'Did not update device',
    );
  });

  afterAll(async () => {
    await TestData.deleteCustomFirmwareBinary(customFirmwareFilePath);
    await container
      .constitute<UserRepository>('UserRepository')
      .deleteByID(testUser.id);
    await container
      .constitute<DeviceAttributeRepository>('DeviceAttributeRepository')
      .deleteByID(CONNECTED_DEVICE_ID);
    await container
      .constitute<DeviceKeyObjectRepository>('DeviceKeyObjectRepository')
      .deleteByID(CONNECTED_DEVICE_ID);
    await container
      .constitute<DeviceAttributeRepository>('DeviceAttributeRepository')
      .deleteByID(DISCONNECTED_DEVICE_ID);
    await container
      .constitute<DeviceKeyObjectRepository>('DeviceKeyObjectRepository')
      .deleteByID(DISCONNECTED_DEVICE_ID);

    await dataSource.destroy();
  });
});
