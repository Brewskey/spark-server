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
describe('DeviceClaimsController', function () {
    var app = (0, createTestApp_1.createTestApp)();
    var container = app.container;
    var DEVICE_ID;
    var testUser;
    var userToken;
    var deviceToApiAttributes;
    beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        var USER_CREDENTIALS, _a, tokenResponse, provisionResponse;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    USER_CREDENTIALS = TestData_1.default.getUser();
                    DEVICE_ID = TestData_1.default.getID();
                    sinon_1.default
                        .stub(container.constitute('EventPublisher'), 'publishAndListenForResponse')
                        .callsFake(function (_a) {
                        var name = _a.name;
                        return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_b) {
                                if (name === spark_protocol_1.SPARK_SERVER_EVENTS.GET_DEVICE_ATTRIBUTES) {
                                    return [2 /*return*/, { error: new Error('Could not get device for ID') }];
                                }
                                if (name === spark_protocol_1.SPARK_SERVER_EVENTS.PING_DEVICE) {
                                    return [2 /*return*/, {
                                            error: undefined,
                                            connected: true,
                                            lastHeard: new Date(),
                                        }];
                                }
                                return [2 /*return*/, { error: new Error('should not happen') }];
                            });
                        });
                    });
                    return [4 /*yield*/, (0, supertest_1.default)(app).post('/v1/users').send(USER_CREDENTIALS)];
                case 1:
                    _b.sent();
                    _a = nullthrows_1.default;
                    return [4 /*yield*/, container
                            .constitute('IUserRepository')
                            .getByUsername(USER_CREDENTIALS.username)];
                case 2:
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
                case 3:
                    tokenResponse = _b.sent();
                    userToken = tokenResponse.body.access_token;
                    if (!userToken) {
                        throw new Error('test user creation fails');
                    }
                    return [4 /*yield*/, (0, supertest_1.default)(app)
                            .post("/v1/provisioning/".concat(DEVICE_ID))
                            .query({ access_token: userToken })
                            .send({ publicKey: TestData_1.default.getPublicKey() })];
                case 4:
                    provisionResponse = _b.sent();
                    deviceToApiAttributes = provisionResponse.body;
                    if (!deviceToApiAttributes.id) {
                        throw new Error('test device creation fails');
                    }
                    return [2 /*return*/];
            }
        });
    }); });
    test("should return claimCode, and user's devices ids", function () { return __awaiter(void 0, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, supertest_1.default)(app)
                        .post('/v1/device_claims')
                        .set('Content-Type', 'application/x-www-form-urlencoded')
                        .send({ access_token: userToken })];
                case 1:
                    response = _a.sent();
                    expect(response.status).toEqual(200);
                    expect(response.body.claim_code).toBeTruthy();
                    expect(response.body.device_ids[0]).toEqual(DEVICE_ID);
                    return [2 /*return*/];
            }
        });
    }); });
    afterAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, container
                        .constitute('IUserRepository')
                        .deleteByID(testUser.id)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, container
                            .constitute('IDeviceAttributeRepository')
                            .deleteByID(DEVICE_ID)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, container
                            .constitute('IDeviceKeyRepository')
                            .deleteByID(DEVICE_ID)];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=DeviceClaimsController.test.js.map