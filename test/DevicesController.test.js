/* eslint-disable */
import test from 'ava';
import request from 'supertest';
import sinon from 'sinon';
import ouathClients from '../src/oauthClients.json';
import app from './setup/testApp';
import TestData from './setup/TestData';


const container = app.container;
let DEVICE_ID = null;
let testUser;
let userToken;
let deviceToApiAttributes;

test.before(async () => {
  const USER_CREDENTIALS = TestData.getUser();
  DEVICE_ID = TestData.getID();

  const userResponse = await request(app)
    .post('/v1/users')
    .send(USER_CREDENTIALS);

  testUser = await container.constitute('UserRepository')
    .getByUsername(USER_CREDENTIALS.username);

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

  if (!userToken) {
    throw new Error('test user creation fails');
  }

  const provisionResponse = await request(app)
    .post(`/v1/provisioning/${DEVICE_ID}`)
    .query({ access_token: userToken })
    .send({ publicKey: TestData.getPublicKey() });

  deviceToApiAttributes = provisionResponse.body;

  if (!deviceToApiAttributes.id) {
    throw new Error('test device creation fails');
  }
});

test('should throw an error for compile source code endpoint', async t => {
  const response = await request(app)
    .post('/v1/binaries')
    .query({ access_token: userToken });

  t.is(response.status, 400);
});

test.serial('should return device details', async t => {
  const response = await request(app)
    .get(`/v1/devices/${DEVICE_ID}`)
    .query({ access_token: userToken });

  t.is(response.status, 200);
  t.is(response.body.id, deviceToApiAttributes.id);
  t.is(response.body.name, deviceToApiAttributes.name);
  t.is(response.body.ownerID, deviceToApiAttributes.ownerID);
});

test.serial('should throw an error if device not found', async t => {
  const response = await request(app)
    .get(`/v1/devices/${DEVICE_ID}123`)
    .query({ access_token: userToken });

  t.is(response.status, 404);
  t.is(response.body.error, 'No device found');
});

test.serial('should return all devices', async t => {
  const response = await request(app)
    .get('/v1/devices/')
    .query({ access_token: userToken });

  const devices = response.body;

  t.is(response.status, 200);
  t.truthy(Array.isArray(devices) && devices.length > 0);
});

test.serial('should unclaim device', async t => {
  const unclaimResponse = await request(app)
    .delete(`/v1/devices/${DEVICE_ID}`)
    .query({ access_token: userToken });

  t.is(unclaimResponse.status, 200);
  t.is(unclaimResponse.body.ok, true);

  const getDeviceResponse = await request(app)
    .get(`/v1/devices/${DEVICE_ID}`)
    .query({ access_token: userToken });

  t.is(getDeviceResponse.status, 404);
});

test.serial('should claim device', async t => {
  const claimDeviceResponse = await request(app)
    .post('/v1/devices')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      access_token: userToken,
      id: DEVICE_ID,
    });

  t.is(claimDeviceResponse.status, 200);
  t.is(claimDeviceResponse.body.ok, true);

  const getDeviceResponse = await request(app)
    .get(`/v1/devices/${DEVICE_ID}`)
    .query({ access_token: userToken });

  t.is(getDeviceResponse.status, 200);
});

test.serial(
  'should throw an error if device belongs to somebody else',
  async t => {
    const deviceAttributesStub = sinon.stub(
      container.constitute('DeviceAttributeRepository'),
      'getById',
    ).returns({ ownerID: TestData.getID()});

    const claimDeviceResponse = await request(app)
      .post('/v1/devices')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        access_token: userToken,
        id: DEVICE_ID,
      });

    deviceAttributesStub.restore();

    t.is(claimDeviceResponse.status, 400);
    t.is(claimDeviceResponse.body.error, 'The device belongs to someone else.');
  },
);

test.serial(
  'should return function call result and device attributes',
  async t => {
    const device = {
      callFunction: (functionName, functionArguments) =>
        functionArguments.arg === 'on' ? 1 : -1,
      ping: () => ({
        connected: true,
        lastPing: new Date(),
      }),
    };

    const deviceServerStub = sinon.stub(
      container.constitute('DeviceServer'),
      'getDevice',
    ).returns(device);

    const callFunctionResponse1 = await request(app)
      .post(`/v1/devices/${DEVICE_ID}/testFunction`)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        access_token: userToken,
        arg: 'on',
      });

    const callFunctionResponse2 = await request(app)
      .post(`/v1/devices/${DEVICE_ID}/testFunction`)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        access_token: userToken,
        arg: 'off',
      });

    deviceServerStub.restore();

    t.is(callFunctionResponse1.status, 200);
    t.is(callFunctionResponse1.body.return_value, 1);
    t.is(callFunctionResponse1.body.connected, true);
    t.is(callFunctionResponse1.body.id, DEVICE_ID);

    t.is(callFunctionResponse2.body.return_value, -1);
  },
);

test.serial(
  'should throw an error if function doesn\'t exist',
  async t => {
    const device = {
      callFunction: (functionName, functionArguments) => {
        if(functionName !== 'testFunction') {
          throw new Error(`Unknown Function ${functionName}`)
        }
        return 1;
      },
      ping: () => ({
        connected: true,
        lastPing: new Date(),
      }),
    };

    const deviceServerStub = sinon.stub(
      container.constitute('DeviceServer'),
      'getDevice',
    ).returns(device);

    const callFunctionResponse = await request(app)
      .post(`/v1/devices/${DEVICE_ID}/wrongTestFunction`)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({
        access_token: userToken,
        arg: 'on',
      });

    deviceServerStub.restore();

    t.is(callFunctionResponse.status, 404);
    t.is(callFunctionResponse.body.error, 'Function not found');
  },
);

test.serial(
  'should return variable value',
  async t => {
    const device = {
      getVariableValue: () => 'resultValue',
    };

    const deviceServerStub = sinon.stub(
      container.constitute('DeviceServer'),
      'getDevice',
    ).returns(device);

    const getVariableResponse = await request(app)
      .get(`/v1/devices/${DEVICE_ID}/varName/`)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .query({ access_token: userToken });

    deviceServerStub.restore();

    t.is(getVariableResponse.status, 200);
    t.is(getVariableResponse.body.result, 'resultValue');
  },
);

test.serial(
  'should throw an error if variable not found',
  async t => {
    const device = {
      getVariableValue: (variableName) => {
        if(variableName !== 'testVariable') {
          throw new Error(`Variable not found`)
        }
        return 1;
      },
    };

    const deviceServerStub = sinon.stub(
      container.constitute('DeviceServer'),
      'getDevice',
    ).returns(device);

    const getVariableResponse = await request(app)
      .get(`/v1/devices/${DEVICE_ID}/varName/`)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .query({ access_token: userToken });

    deviceServerStub.restore();

    t.is(getVariableResponse.status, 404);
    t.is(getVariableResponse.body.error, 'Variable not found');
  },
);

// TODO write tests for updateDevice

test.after.always(async (): Promise<void> => {
  await container.constitute('UserRepository').deleteById(testUser.id);
  await container.constitute('DeviceAttributeRepository').deleteById(DEVICE_ID);
  await container.constitute('DeviceKeyRepository').delete(DEVICE_ID);
});
