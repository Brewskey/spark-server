"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var supertest_1 = __importDefault(require("supertest"));
var sinon_1 = __importDefault(require("sinon"));
var oauthClients_json_1 = __importDefault(require("../oauthClients.json"));
var createTestApp_1 = require("./setup/createTestApp");
var TestData_1 = __importDefault(require("./setup/TestData"));
var spark_protocol_1 = require("spark-protocol");
var nullthrows_1 = __importDefault(require("nullthrows"));
describe('DevicesController', function () {
    var app = (0, createTestApp_1.createTestApp)();
    var container = app.container;
    var customFirmwareFilePath;
    var USER_CREDENTIALS = TestData_1.default.getUser();
    var CONNECTED_DEVICE_ID = TestData_1.default.getID();
    var DISCONNECTED_DEVICE_ID = TestData_1.default.getID();
    var testUser;
    var userToken;
    var connectedDeviceToApiAttributes;
    var disconnectedDeviceToApiAttributes;
    var TEST_LAST_HEARD = new Date();
    var TEST_DEVICE_FUNCTIONS = ['testFunction'];
    var TEST_FUNCTION_ARGUMENT = 'testArgument';
    var TEST_DEVICE_VARIABLES = ['testVariable1', 'testVariable2'];
    var TEST_VARIABLE_RESULT = 'resultValue';
    beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        var filePath, _a, tokenResponse, provisionConnectedDeviceResponse, provisionDisconnectedDeviceResponse;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    sinon_1.default
                        .stub(container.constitute('EventPublisher'), 'publishAndListenForResponse')
                        .callsFake(function (_a) {
                        var name = _a.name, _b = _a.context, deviceID = _b.deviceID, functionArguments = _b.functionArguments, functionName = _b.functionName, shouldShowSignal = _b.shouldShowSignal, variableName = _b.variableName;
                        return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_c) {
                                if (name === spark_protocol_1.SPARK_SERVER_EVENTS.PING_DEVICE) {
                                    return [2 /*return*/, deviceID === CONNECTED_DEVICE_ID
                                            ? {
                                                connected: true,
                                                lastHeard: TEST_LAST_HEARD,
                                            }
                                            : {
                                                connected: false,
                                                lastHeard: null,
                                            }];
                                }
                                if (deviceID !== CONNECTED_DEVICE_ID) {
                                    return [2 /*return*/, { error: new Error('Could not get device for ID') }];
                                }
                                if (name === spark_protocol_1.SPARK_SERVER_EVENTS.CALL_DEVICE_FUNCTION) {
                                    if (TEST_DEVICE_FUNCTIONS.includes(functionName)) {
                                        return [2 /*return*/, { result: functionArguments.argument }];
                                    }
                                    else {
                                        return [2 /*return*/, { error: new Error("Unknown Function ".concat(functionName)) }];
                                    }
                                }
                                if (name === spark_protocol_1.SPARK_SERVER_EVENTS.GET_DEVICE_ATTRIBUTES) {
                                    return [2 /*return*/, {
                                            deviceID: CONNECTED_DEVICE_ID,
                                            functions: TEST_DEVICE_FUNCTIONS,
                                            lastHeard: TEST_LAST_HEARD,
                                            ownerID: testUser.id,
                                            variables: TEST_DEVICE_VARIABLES,
                                        }];
                                }
                                if (name === spark_protocol_1.SPARK_SERVER_EVENTS.GET_DEVICE_VARIABLE_VALUE) {
                                    if (!TEST_DEVICE_VARIABLES.includes(variableName)) {
                                        throw new Error('Variable not found');
                                    }
                                    return [2 /*return*/, { result: TEST_VARIABLE_RESULT }];
                                }
                                if (name === spark_protocol_1.SPARK_SERVER_EVENTS.FLASH_DEVICE) {
                                    return [2 /*return*/, { status: 'Update finished' }];
                                }
                                if (name === spark_protocol_1.SPARK_SERVER_EVENTS.RAISE_YOUR_HAND) {
                                    return [2 /*return*/, shouldShowSignal ? { status: 1 } : { status: 0 }];
                                }
                                return [2 /*return*/, { error: new Error('Should not happen') }];
                            });
                        });
                    });
                    return [4 /*yield*/, TestData_1.default.createCustomFirmwareBinary()];
                case 1:
                    filePath = (_b.sent()).filePath;
                    customFirmwareFilePath = filePath;
                    return [4 /*yield*/, (0, supertest_1.default)(app).post('/v1/users').send(USER_CREDENTIALS)];
                case 2:
                    _b.sent();
                    _a = nullthrows_1.default;
                    return [4 /*yield*/, container
                            .constitute('IUserRepository')
                            .getByUsername(USER_CREDENTIALS.username)];
                case 3:
                    testUser = _a.apply(void 0, [_b.sent()]);
                    return [4 /*yield*/, (0, supertest_1.default)(app)
                            .post('/oauth/token')
                            .set('Content-Type', 'application/x-www-form-urlencoded')
                            .send({
                            client_id: oauthClients_json_1.default[0].clientId,
                            client_secret: oauthClients_json_1.default[0].clientSecret,
                            grant_type: 'password',
                            password: USER_CREDENTIALS.password,
                            username: USER_CREDENTIALS.username,
                        })];
                case 4:
                    tokenResponse = _b.sent();
                    userToken = tokenResponse.body.access_token;
                    if (!userToken) {
                        throw new Error('test user creation fails');
                    }
                    return [4 /*yield*/, (0, supertest_1.default)(app)
                            .post("/v1/provisioning/".concat(CONNECTED_DEVICE_ID))
                            .query({ access_token: userToken })
                            .send({ publicKey: TestData_1.default.getPublicKey() })];
                case 5:
                    provisionConnectedDeviceResponse = _b.sent();
                    connectedDeviceToApiAttributes = provisionConnectedDeviceResponse.body;
                    return [4 /*yield*/, (0, supertest_1.default)(app)
                            .post("/v1/provisioning/".concat(DISCONNECTED_DEVICE_ID))
                            .query({ access_token: userToken })
                            .send({ publicKey: TestData_1.default.getPublicKey() })];
                case 6:
                    provisionDisconnectedDeviceResponse = _b.sent();
                    disconnectedDeviceToApiAttributes =
                        provisionDisconnectedDeviceResponse.body;
                    if (!connectedDeviceToApiAttributes.id ||
                        !disconnectedDeviceToApiAttributes.id) {
                        throw new Error('test devices creation fails');
                    }
                    return [2 /*return*/];
            }
        });
    }); });
    test('should throw an error for compile source code endpoint', function () { return __awaiter(void 0, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, supertest_1.default)(app)
                        .post('/v1/binaries')
                        .query({ access_token: userToken })];
                case 1:
                    response = _a.sent();
                    expect(response.status).toEqual(400);
                    return [2 /*return*/];
            }
        });
    }); });
    test('should return device details for connected device', function () { return __awaiter(void 0, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, supertest_1.default)(app)
                        .get("/v1/devices/".concat(CONNECTED_DEVICE_ID))
                        .query({ access_token: userToken })];
                case 1:
                    response = _a.sent();
                    expect(response.status).toEqual(200);
                    expect(response.body.connected).toBeTruthy();
                    expect(JSON.stringify(response.body.functions)).toEqual(JSON.stringify(TEST_DEVICE_FUNCTIONS));
                    expect(response.body.id).toEqual(connectedDeviceToApiAttributes.id);
                    expect(response.body.name).toEqual(connectedDeviceToApiAttributes.name);
                    expect(response.body.ownerID).toEqual(connectedDeviceToApiAttributes.ownerID);
                    expect(JSON.stringify(response.body.variables)).toEqual(JSON.stringify(TEST_DEVICE_VARIABLES));
                    expect(response.body.last_heard).toEqual(TEST_LAST_HEARD.toISOString());
                    return [2 /*return*/];
            }
        });
    }); });
    test('should return device details for disconnected device', function () { return __awaiter(void 0, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, supertest_1.default)(app)
                        .get("/v1/devices/".concat(DISCONNECTED_DEVICE_ID))
                        .query({ access_token: userToken })];
                case 1:
                    response = _a.sent();
                    expect(response.status).toEqual(200);
                    expect(response.body.connected).toEqual(false);
                    expect(response.body.functions).toBeNull();
                    expect(response.body.id).toEqual(disconnectedDeviceToApiAttributes.id);
                    expect(response.body.name).toEqual(disconnectedDeviceToApiAttributes.name);
                    expect(response.body.ownerID).toEqual(disconnectedDeviceToApiAttributes.ownerID);
                    expect(response.body.variables).toBeNull();
                    return [2 /*return*/];
            }
        });
    }); });
    test('should throw an error if device not found', function () { return __awaiter(void 0, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, supertest_1.default)(app)
                        .get("/v1/devices/".concat(CONNECTED_DEVICE_ID, "123"))
                        .query({ access_token: userToken })];
                case 1:
                    response = _a.sent();
                    expect(response.status).toEqual(404);
                    expect(response.body.error).toEqual('No device found');
                    return [2 /*return*/];
            }
        });
    }); });
    test('should return all devices', function () { return __awaiter(void 0, void 0, void 0, function () {
        var response, devices;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, supertest_1.default)(app)
                        .get('/v1/devices/')
                        .query({ access_token: userToken })];
                case 1:
                    response = _a.sent();
                    devices = response.body;
                    expect(response.status).toEqual(200);
                    expect(Array.isArray(devices) && devices.length > 0).toBeTruthy();
                    return [2 /*return*/];
            }
        });
    }); });
    test('should unclaim device', function () { return __awaiter(void 0, void 0, void 0, function () {
        var unclaimResponse, getDeviceResponse;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, supertest_1.default)(app)
                        .delete("/v1/devices/".concat(DISCONNECTED_DEVICE_ID))
                        .query({ access_token: userToken })];
                case 1:
                    unclaimResponse = _a.sent();
                    expect(unclaimResponse.status).toEqual(200);
                    expect(unclaimResponse.body.ok).toEqual(true);
                    return [4 /*yield*/, (0, supertest_1.default)(app)
                            .get("/v1/devices/".concat(DISCONNECTED_DEVICE_ID))
                            .query({ access_token: userToken })];
                case 2:
                    getDeviceResponse = _a.sent();
                    expect(getDeviceResponse.status).toEqual(403);
                    return [2 /*return*/];
            }
        });
    }); });
    test('should claim device', function () { return __awaiter(void 0, void 0, void 0, function () {
        var claimDeviceResponse, getDeviceResponse;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, supertest_1.default)(app)
                        .post('/v1/devices')
                        .set('Content-Type', 'application/x-www-form-urlencoded')
                        .send({
                        access_token: userToken,
                        id: DISCONNECTED_DEVICE_ID,
                    })];
                case 1:
                    claimDeviceResponse = _a.sent();
                    expect(claimDeviceResponse.status).toEqual(200);
                    expect(claimDeviceResponse.body.ok).toEqual(true);
                    return [4 /*yield*/, (0, supertest_1.default)(app)
                            .get("/v1/devices/".concat(DISCONNECTED_DEVICE_ID))
                            .query({ access_token: userToken })];
                case 2:
                    getDeviceResponse = _a.sent();
                    expect(getDeviceResponse.status).toEqual(200);
                    return [2 /*return*/];
            }
        });
    }); });
    test('should throw a error if device is already claimed by the user', function () { return __awaiter(void 0, void 0, void 0, function () {
        var claimDeviceResponse;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, supertest_1.default)(app)
                        .post('/v1/devices')
                        .set('Content-Type', 'application/x-www-form-urlencoded')
                        .send({
                        access_token: userToken,
                        id: CONNECTED_DEVICE_ID,
                    })];
                case 1:
                    claimDeviceResponse = _a.sent();
                    expect(claimDeviceResponse.status).toEqual(400);
                    expect(claimDeviceResponse.body.error).toEqual('The device is already claimed.');
                    return [2 /*return*/];
            }
        });
    }); });
    test('should throw an error if device belongs to somebody else', function () { return __awaiter(void 0, void 0, void 0, function () {
        var deviceAttributesStub, claimDeviceResponse;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    deviceAttributesStub = sinon_1.default
                        .stub(container.constitute('IDeviceAttributeRepository'), 'getByID')
                        .resolves({ ownerID: TestData_1.default.getID() });
                    return [4 /*yield*/, (0, supertest_1.default)(app)
                            .post('/v1/devices')
                            .set('Content-Type', 'application/x-www-form-urlencoded')
                            .send({
                            access_token: userToken,
                            id: CONNECTED_DEVICE_ID,
                        })];
                case 1:
                    claimDeviceResponse = _a.sent();
                    deviceAttributesStub.restore();
                    expect(claimDeviceResponse.status).toEqual(400);
                    expect(claimDeviceResponse.body.error).toEqual('The device belongs to someone else.');
                    return [2 /*return*/];
            }
        });
    }); });
    test('should return function call result and device attributes', function () { return __awaiter(void 0, void 0, void 0, function () {
        var callFunctionResponse;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, supertest_1.default)(app)
                        .post("/v1/devices/".concat(CONNECTED_DEVICE_ID, "/").concat(TEST_DEVICE_FUNCTIONS[0]))
                        .set('Content-Type', 'application/x-www-form-urlencoded')
                        .send({
                        access_token: userToken,
                        argument: TEST_FUNCTION_ARGUMENT,
                    })];
                case 1:
                    callFunctionResponse = _a.sent();
                    expect(callFunctionResponse.status).toEqual(200);
                    expect(callFunctionResponse.body.return_value).toEqual(TEST_FUNCTION_ARGUMENT);
                    expect(callFunctionResponse.body.connected).toEqual(true);
                    expect(callFunctionResponse.body.id).toEqual(CONNECTED_DEVICE_ID);
                    return [2 /*return*/];
            }
        });
    }); });
    test("should throw an error if function doesn't exist", function () { return __awaiter(void 0, void 0, void 0, function () {
        var callFunctionResponse;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, supertest_1.default)(app)
                        .post("/v1/devices/".concat(CONNECTED_DEVICE_ID, "/wrong").concat(TEST_DEVICE_FUNCTIONS[0]))
                        .set('Content-Type', 'application/x-www-form-urlencoded')
                        .send({
                        access_token: userToken,
                    })];
                case 1:
                    callFunctionResponse = _a.sent();
                    expect(callFunctionResponse.status).toEqual(404);
                    expect(callFunctionResponse.body.error).toEqual('Function not found');
                    return [2 /*return*/];
            }
        });
    }); });
    test('should return variable value', function () { return __awaiter(void 0, void 0, void 0, function () {
        var getVariableResponse;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, supertest_1.default)(app)
                        .get("/v1/devices/".concat(CONNECTED_DEVICE_ID, "/").concat(TEST_DEVICE_VARIABLES[0], "/"))
                        .set('Content-Type', 'application/x-www-form-urlencoded')
                        .query({ access_token: userToken })];
                case 1:
                    getVariableResponse = _a.sent();
                    expect(getVariableResponse.status).toEqual(200);
                    expect(getVariableResponse.body.result).toEqual(TEST_VARIABLE_RESULT);
                    return [2 /*return*/];
            }
        });
    }); });
    test('should throw an error if variable not found', function () { return __awaiter(void 0, void 0, void 0, function () {
        var getVariableResponse;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, supertest_1.default)(app)
                        .get("/v1/devices/".concat(CONNECTED_DEVICE_ID, "/wrong").concat(TEST_DEVICE_VARIABLES[0], "/"))
                        .set('Content-Type', 'application/x-www-form-urlencoded')
                        .query({ access_token: userToken })];
                case 1:
                    getVariableResponse = _a.sent();
                    expect(getVariableResponse.status).toEqual(404);
                    expect(getVariableResponse.body.error).toEqual('Variable not found');
                    return [2 /*return*/];
            }
        });
    }); });
    test('should rename device', function () { return __awaiter(void 0, void 0, void 0, function () {
        var newDeviceName, renameDeviceResponse;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    newDeviceName = 'newDeviceName';
                    return [4 /*yield*/, (0, supertest_1.default)(app)
                            .put("/v1/devices/".concat(CONNECTED_DEVICE_ID))
                            .set('Content-Type', 'application/x-www-form-urlencoded')
                            .send({
                            access_token: userToken,
                            name: newDeviceName,
                        })];
                case 1:
                    renameDeviceResponse = _a.sent();
                    expect(renameDeviceResponse.status).toEqual(200);
                    expect(renameDeviceResponse.body.name).toEqual(newDeviceName);
                    return [2 /*return*/];
            }
        });
    }); });
    test('should invoke raise your hand on device', function () { return __awaiter(void 0, void 0, void 0, function () {
        var raiseYourHandResponse;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, supertest_1.default)(app)
                        .put("/v1/devices/".concat(CONNECTED_DEVICE_ID))
                        .set('Content-Type', 'application/x-www-form-urlencoded')
                        .send({
                        access_token: userToken,
                        signal: '1',
                    })];
                case 1:
                    raiseYourHandResponse = _a.sent();
                    expect(raiseYourHandResponse.status).toEqual(200);
                    return [2 /*return*/];
            }
        });
    }); });
    test('should throw an error if signal is wrong value', function () { return __awaiter(void 0, void 0, void 0, function () {
        var raiseYourHandResponse;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, supertest_1.default)(app)
                        .put("/v1/devices/".concat(CONNECTED_DEVICE_ID))
                        .set('Content-Type', 'application/x-www-form-urlencoded')
                        .send({
                        access_token: userToken,
                        signal: 'some wrong value',
                    })];
                case 1:
                    raiseYourHandResponse = _a.sent();
                    expect(raiseYourHandResponse.status).toEqual(400);
                    expect(raiseYourHandResponse.body.error).toEqual('Wrong signal value');
                    return [2 /*return*/];
            }
        });
    }); });
    test('should start device flashing process with known application', function () { return __awaiter(void 0, void 0, void 0, function () {
        var knownAppName, knownAppBuffer, deviceFirmwareStub, flashKnownAppResponse;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    knownAppName = 'knownAppName';
                    knownAppBuffer = new Buffer(knownAppName);
                    deviceFirmwareStub = sinon_1.default
                        .stub(container.constitute('IDeviceFirmwareRepository'), 'getByName')
                        .returns(knownAppBuffer);
                    return [4 /*yield*/, (0, supertest_1.default)(app)
                            .put("/v1/devices/".concat(CONNECTED_DEVICE_ID))
                            .set('Content-Type', 'application/x-www-form-urlencoded')
                            .send({
                            access_token: userToken,
                            app_id: knownAppName,
                        })];
                case 1:
                    flashKnownAppResponse = _a.sent();
                    deviceFirmwareStub.restore();
                    expect(flashKnownAppResponse.status).toEqual(200);
                    expect(flashKnownAppResponse.body.status).toEqual('Update finished');
                    expect(flashKnownAppResponse.body.id).toEqual(CONNECTED_DEVICE_ID);
                    return [2 /*return*/];
            }
        });
    }); });
    test('should throws an error if known application not found', function () { return __awaiter(void 0, void 0, void 0, function () {
        var knownAppName, flashKnownAppResponse;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    knownAppName = 'knownAppName';
                    return [4 /*yield*/, (0, supertest_1.default)(app)
                            .put("/v1/devices/".concat(CONNECTED_DEVICE_ID))
                            .set('Content-Type', 'application/x-www-form-urlencoded')
                            .send({
                            access_token: userToken,
                            app_id: knownAppName,
                        })];
                case 1:
                    flashKnownAppResponse = _a.sent();
                    expect(flashKnownAppResponse.status).toEqual(404);
                    expect(flashKnownAppResponse.body.error).toEqual("No firmware ".concat(knownAppName, " found"));
                    return [2 /*return*/];
            }
        });
    }); });
    test('should start device flashing process with custom application', function () { return __awaiter(void 0, void 0, void 0, function () {
        var flashCustomFirmwareResponse;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, supertest_1.default)(app)
                        .put("/v1/devices/".concat(CONNECTED_DEVICE_ID))
                        .set('Content-Type', 'application/x-www-form-urlencoded')
                        .attach('file', customFirmwareFilePath)
                        .query({ access_token: userToken })];
                case 1:
                    flashCustomFirmwareResponse = _a.sent();
                    expect(flashCustomFirmwareResponse.status).toEqual(200);
                    expect(flashCustomFirmwareResponse.body.status).toEqual('Update finished');
                    expect(flashCustomFirmwareResponse.body.id).toEqual(CONNECTED_DEVICE_ID);
                    return [2 /*return*/];
            }
        });
    }); });
    test('should throw an error if custom firmware file not provided', function () { return __awaiter(void 0, void 0, void 0, function () {
        var flashCustomFirmwareResponse;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, supertest_1.default)(app)
                        .put("/v1/devices/".concat(CONNECTED_DEVICE_ID))
                        .set('Content-Type', 'application/x-www-form-urlencoded')
                        .field('file_type', 'binary')
                        .query({ access_token: userToken })];
                case 1:
                    flashCustomFirmwareResponse = _a.sent();
                    expect(flashCustomFirmwareResponse.status).toEqual(400);
                    expect(flashCustomFirmwareResponse.body.error).toEqual('Firmware file not provided');
                    return [2 /*return*/];
            }
        });
    }); });
    test('should throw an error if custom firmware file type not binary', function () { return __awaiter(void 0, void 0, void 0, function () {
        var flashCustomFirmwareResponse;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, supertest_1.default)(app)
                        .put("/v1/devices/".concat(CONNECTED_DEVICE_ID))
                        .set('Content-Type', 'application/x-www-form-urlencoded')
                        // send random not binary file
                        .attach('file', __filename)
                        .query({ access_token: userToken })];
                case 1:
                    flashCustomFirmwareResponse = _a.sent();
                    expect(flashCustomFirmwareResponse.status).toEqual(400);
                    expect(flashCustomFirmwareResponse.body.error).toEqual('Did not update device');
                    return [2 /*return*/];
            }
        });
    }); });
    afterAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, TestData_1.default.deleteCustomFirmwareBinary(customFirmwareFilePath)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, container
                            .constitute('IUserRepository')
                            .deleteByID(testUser.id)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, container
                            .constitute('IDeviceAttributeRepository')
                            .deleteByID(CONNECTED_DEVICE_ID)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, container
                            .constitute('IDeviceKeyRepository')
                            .deleteByID(CONNECTED_DEVICE_ID)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, container
                            .constitute('IDeviceAttributeRepository')
                            .deleteByID(DISCONNECTED_DEVICE_ID)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, container
                            .constitute('IDeviceKeyRepository')
                            .deleteByID(DISCONNECTED_DEVICE_ID)];
                case 6:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=DevicesController.test.js.map