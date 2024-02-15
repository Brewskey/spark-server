"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var sinon_1 = __importDefault(require("sinon"));
var spark_protocol_1 = require("spark-protocol");
var WebhookFileRepository_1 = __importDefault(require("../repository/WebhookFileRepository"));
var WebhookManager_1 = __importDefault(require("../managers/WebhookManager"));
var TestData_1 = __importDefault(require("./setup/TestData"));
var PermissionManager_1 = __importDefault(require("../managers/PermissionManager"));
var WEBHOOK_BASE = {
    event: 'test-event',
    requestType: 'POST',
    url: 'https://webhook-test.com/67fcfefd07229639ddc49a1ba71816f2',
    created_at: new Date(),
    id: 'test-id',
    ownerID: 'test-owner-id',
};
var getEvent = function (data) { return ({
    data: data,
    deviceID: TestData_1.default.getID(),
    name: 'test-event',
    publishedAt: new Date(),
    ttl: 60,
    userID: TestData_1.default.getID(),
    isPublic: false,
    isInternal: false,
}); };
var getDefaultRequestData = function (event) { return ({
    coreid: event.deviceID,
    data: event.data,
    event: event.name,
    published_at: event.publishedAt,
}); };
describe('WebhookManager', function () {
    var repository;
    var eventPublisher;
    var permissionManager = Object.create(PermissionManager_1.default);
    beforeAll(function () {
        repository = new WebhookFileRepository_1.default('');
        repository.getAll = sinon_1.default.stub().returns([]);
        eventPublisher = new spark_protocol_1.EventPublisher();
        eventPublisher.publish = sinon_1.default.stub();
    });
    test('should run basic request', function () { return __awaiter(void 0, void 0, void 0, function () {
        var manager, data, event, defaultRequestData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    manager = new WebhookManager_1.default(eventPublisher, permissionManager, repository);
                    data = 'testData';
                    event = getEvent(data);
                    defaultRequestData = getDefaultRequestData(event);
                    manager._callWebhook = sinon_1.default.spy(function (_webhook, _event, requestOptions) { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            expect(requestOptions.auth).toBeUndefined();
                            expect(requestOptions.body).toBeUndefined();
                            expect(JSON.stringify(requestOptions.form)).toEqual(JSON.stringify(defaultRequestData));
                            expect(requestOptions.headers).toBeUndefined();
                            expect(requestOptions.method).toEqual(WEBHOOK_BASE.requestType);
                            expect(requestOptions.qs).toBeUndefined();
                            expect(requestOptions.url).toEqual(WEBHOOK_BASE.url);
                            return [2 /*return*/, {}];
                        });
                    }); });
                    return [4 /*yield*/, manager.runWebhook(WEBHOOK_BASE, event)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    test('should run basic request without default data', function () { return __awaiter(void 0, void 0, void 0, function () {
        var manager, webhook, data, event;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    manager = new WebhookManager_1.default(eventPublisher, permissionManager, repository);
                    webhook = __assign(__assign({}, WEBHOOK_BASE), { noDefaults: true });
                    data = 'testData';
                    event = getEvent(data);
                    manager._callWebhook = sinon_1.default.spy(function (_webhook, _event, requestOptions) { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            expect(requestOptions.auth).toBeUndefined();
                            expect(requestOptions.body).toBeUndefined();
                            expect(requestOptions.form).toEqual(data);
                            expect(requestOptions.headers).toBeUndefined();
                            expect(requestOptions.method).toEqual(WEBHOOK_BASE.requestType);
                            expect(requestOptions.qs).toBeUndefined();
                            expect(requestOptions.url).toEqual(WEBHOOK_BASE.url);
                            return [2 /*return*/, {}];
                        });
                    }); });
                    return [4 /*yield*/, manager.runWebhook(webhook, event)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    test('should compile json body', function () { return __awaiter(void 0, void 0, void 0, function () {
        var manager, data, event, webhook, defaultRequestData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    manager = new WebhookManager_1.default(eventPublisher, permissionManager, repository);
                    data = '{"t":"123"}';
                    event = getEvent(data);
                    webhook = __assign(__assign({}, WEBHOOK_BASE), { json: {
                            testValue: '{{t}}',
                        } });
                    defaultRequestData = getDefaultRequestData(event);
                    manager._callWebhook = sinon_1.default.spy(function (_webhook, _event, requestOptions) { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            expect(requestOptions.auth).toBeUndefined();
                            expect(JSON.stringify(requestOptions.body)).toEqual(JSON.stringify(__assign(__assign({}, defaultRequestData), { testValue: '123' })));
                            expect(requestOptions.form).toBeUndefined();
                            expect(requestOptions.headers).toBeUndefined();
                            expect(requestOptions.method).toEqual(WEBHOOK_BASE.requestType);
                            expect(requestOptions.qs).toBeUndefined();
                            expect(requestOptions.url).toEqual(WEBHOOK_BASE.url);
                            return [2 /*return*/, {}];
                        });
                    }); });
                    return [4 /*yield*/, manager.runWebhook(webhook, event)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    test('should compile form body', function () { return __awaiter(void 0, void 0, void 0, function () {
        var manager, data, event, webhook, defaultRequestData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    manager = new WebhookManager_1.default(eventPublisher, permissionManager, repository);
                    data = '{"t":"123","g": "foo bar"}';
                    event = getEvent(data);
                    webhook = __assign(__assign({}, WEBHOOK_BASE), { form: {
                            testValue: '{{t}}',
                            testValue2: '{{g}}',
                        } });
                    defaultRequestData = getDefaultRequestData(event);
                    manager._callWebhook = sinon_1.default.spy(function (_webhook, _event, requestOptions) { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            expect(requestOptions.auth).toBeUndefined();
                            expect(requestOptions.body).toBeUndefined();
                            expect(JSON.stringify(requestOptions.form)).toEqual(JSON.stringify(__assign(__assign({}, defaultRequestData), { testValue: '123', testValue2: 'foo bar' })));
                            expect(requestOptions.headers).toBeUndefined();
                            expect(requestOptions.method).toEqual(WEBHOOK_BASE.requestType);
                            expect(requestOptions.qs).toBeUndefined();
                            expect(requestOptions.url).toEqual(WEBHOOK_BASE.url);
                            return [2 /*return*/, {}];
                        });
                    }); });
                    return [4 /*yield*/, manager.runWebhook(webhook, event)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    test('should compile request auth header', function () { return __awaiter(void 0, void 0, void 0, function () {
        var manager, data, event, webhook, defaultRequestData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    manager = new WebhookManager_1.default(eventPublisher, permissionManager, repository);
                    data = '{"username":"123","password": "foobar"}';
                    event = getEvent(data);
                    webhook = __assign(__assign({}, WEBHOOK_BASE), { auth: {
                            username: '{{username}}',
                            password: '{{password}}',
                        } });
                    defaultRequestData = getDefaultRequestData(event);
                    manager._callWebhook = sinon_1.default.spy(function (_webhook, _event, requestOptions) { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            expect(JSON.stringify(requestOptions.auth)).toEqual(JSON.stringify({
                                username: '123',
                                password: 'foobar',
                            }));
                            expect(requestOptions.body).toBeUndefined();
                            expect(JSON.stringify(requestOptions.form)).toEqual(JSON.stringify(defaultRequestData));
                            expect(requestOptions.headers).toBeUndefined();
                            expect(requestOptions.method).toEqual(WEBHOOK_BASE.requestType);
                            expect(requestOptions.url).toEqual(WEBHOOK_BASE.url);
                            return [2 /*return*/, {}];
                        });
                    }); });
                    return [4 /*yield*/, manager.runWebhook(webhook, event)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    test('should compile request headers', function () { return __awaiter(void 0, void 0, void 0, function () {
        var manager, data, event, webhook, defaultRequestData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    manager = new WebhookManager_1.default(eventPublisher, permissionManager, repository);
                    data = '{"t":"123","g": "foobar"}';
                    event = getEvent(data);
                    webhook = __assign(__assign({}, WEBHOOK_BASE), { headers: {
                            testHeader1: '{{t}}',
                            testHeader2: '{{g}}',
                        } });
                    defaultRequestData = getDefaultRequestData(event);
                    manager._callWebhook = sinon_1.default.spy(function (_webhook, _event, requestOptions) { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            expect(requestOptions.auth).toBeUndefined();
                            expect(requestOptions.body).toBeUndefined();
                            expect(JSON.stringify(requestOptions.form)).toEqual(JSON.stringify(defaultRequestData));
                            expect(JSON.stringify(requestOptions.headers)).toEqual(JSON.stringify({
                                testHeader1: '123',
                                testHeader2: 'foobar',
                            }));
                            expect(requestOptions.method).toEqual(WEBHOOK_BASE.requestType);
                            expect(requestOptions.url).toEqual(WEBHOOK_BASE.url);
                            return [2 /*return*/, {}];
                        });
                    }); });
                    return [4 /*yield*/, manager.runWebhook(webhook, event)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    test('should compile request url', function () { return __awaiter(void 0, void 0, void 0, function () {
        var manager, data, event, webhook, defaultRequestData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    manager = new WebhookManager_1.default(eventPublisher, permissionManager, repository);
                    data = '{"t":"123","g": "foobar"}';
                    event = getEvent(data);
                    webhook = __assign(__assign({}, WEBHOOK_BASE), { url: 'https://webhook-test.com/67fcfefd07229639ddc49a1ba71816f2/{{t}}/{{g}}' });
                    defaultRequestData = getDefaultRequestData(event);
                    manager._callWebhook = sinon_1.default.spy(function (_webhook, _event, requestOptions) { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            expect(requestOptions.auth).toBeUndefined();
                            expect(requestOptions.body).toBeUndefined();
                            expect(JSON.stringify(requestOptions.form)).toEqual(JSON.stringify(defaultRequestData));
                            expect(requestOptions.headers).toBeUndefined();
                            expect(requestOptions.method).toEqual(WEBHOOK_BASE.requestType);
                            expect(requestOptions.qs).toBeUndefined();
                            expect(requestOptions.url).toEqual('https://test.com/123/foobar');
                            return [2 /*return*/, {}];
                        });
                    }); });
                    return [4 /*yield*/, manager.runWebhook(webhook, event)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    test('should compile request query', function () { return __awaiter(void 0, void 0, void 0, function () {
        var manager, data, event, webhook, defaultRequestData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    manager = new WebhookManager_1.default(eventPublisher, permissionManager, repository);
                    data = '{"t":"123","g": "foobar"}';
                    event = getEvent(data);
                    webhook = __assign(__assign({}, WEBHOOK_BASE), { query: {
                            testValue: '{{t}}',
                            testValue2: '{{g}}',
                        } });
                    defaultRequestData = getDefaultRequestData(event);
                    manager._callWebhook = sinon_1.default.spy(function (_webhook, _event, requestOptions) { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            expect(requestOptions.auth).toBeUndefined();
                            expect(requestOptions.body).toBeUndefined();
                            expect(JSON.stringify(requestOptions.form)).toEqual(JSON.stringify(defaultRequestData));
                            expect(requestOptions.headers).toBeUndefined();
                            expect(requestOptions.method).toEqual(WEBHOOK_BASE.requestType);
                            expect(JSON.stringify(requestOptions.qs)).toEqual(JSON.stringify({ testValue: '123', testValue2: 'foobar' }));
                            expect(requestOptions.url).toEqual(WEBHOOK_BASE.url);
                            return [2 /*return*/, {}];
                        });
                    }); });
                    return [4 /*yield*/, manager.runWebhook(webhook, event)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    test('should compile requestType', function () { return __awaiter(void 0, void 0, void 0, function () {
        var manager, data, event, webhook, defaultRequestData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    manager = new WebhookManager_1.default(eventPublisher, permissionManager, repository);
                    data = '{"t":"123","requestType": "post"}';
                    event = getEvent(data);
                    webhook = __assign(__assign({}, WEBHOOK_BASE), { requestType: '{{requestType}}' });
                    defaultRequestData = getDefaultRequestData(event);
                    manager._callWebhook = sinon_1.default.spy(function (_webhook, _event, requestOptions) { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            expect(requestOptions.auth).toBeUndefined();
                            expect(requestOptions.body).toBeUndefined();
                            expect(JSON.stringify(requestOptions.form)).toEqual(JSON.stringify(defaultRequestData));
                            expect(requestOptions.headers).toBeUndefined();
                            expect(requestOptions.method).toEqual('POST');
                            expect(requestOptions.url).toEqual(WEBHOOK_BASE.url);
                            return [2 /*return*/, {}];
                        });
                    }); });
                    return [4 /*yield*/, manager.runWebhook(webhook, event)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    test('should throw an error if wrong requestType is provided', function () { return __awaiter(void 0, void 0, void 0, function () {
        var manager, testRequestType, data, event, webhook;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    manager = new WebhookManager_1.default(eventPublisher, permissionManager, repository);
                    testRequestType = 'wrongRequestType';
                    data = "{\"t\":\"123\",\"requestType\": \"".concat(testRequestType, "\"}");
                    event = getEvent(data);
                    webhook = __assign(__assign({}, WEBHOOK_BASE), { requestType: '{{requestType}}' });
                    // Logger.error = sinon.spy((message: string) => {
                    //   expect(message).toEqual('webhookError: Error: wrong requestType');
                    // });
                    return [4 /*yield*/, manager.runWebhook(webhook, event)];
                case 1:
                    // Logger.error = sinon.spy((message: string) => {
                    //   expect(message).toEqual('webhookError: Error: wrong requestType');
                    // });
                    _a.sent();
                    expect(true).toBeTruthy();
                    return [2 /*return*/];
            }
        });
    }); });
    test('should publish sent event', function () { return __awaiter(void 0, void 0, void 0, function () {
        var manager, event;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    manager = new WebhookManager_1.default(eventPublisher, permissionManager, repository);
                    event = getEvent();
                    eventPublisher.publish = sinon_1.default.spy(function (_a) {
                        var data = _a.data, name = _a.name, userID = _a.userID;
                        expect(data).toBeUndefined();
                        expect(name).toEqual("hook-sent/".concat(event.name));
                        expect(userID).toEqual(event.userID);
                    });
                    return [4 /*yield*/, manager.runWebhook(WEBHOOK_BASE, event)];
                case 1:
                    _a.sent();
                    expect(true).toBeTruthy();
                    return [2 /*return*/];
            }
        });
    }); });
    test('should publish default topic', function () { return __awaiter(void 0, void 0, void 0, function () {
        var manager, event;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    manager = new WebhookManager_1.default(eventPublisher, permissionManager, repository);
                    event = getEvent();
                    manager._callWebhook = sinon_1.default.stub().returns('data');
                    eventPublisher.publish = sinon_1.default.spy(function (_a) {
                        var data = _a.data, name = _a.name, userID = _a.userID;
                        expect(data.toString()).toEqual('data');
                        expect(name).toEqual("hook-response/".concat(event.name, "/0"));
                        expect(userID).toEqual(event.userID);
                    });
                    return [4 /*yield*/, manager.runWebhook(WEBHOOK_BASE, event)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    test('should compile response topic and publish', function () { return __awaiter(void 0, void 0, void 0, function () {
        var manager, event, webhook;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    manager = new WebhookManager_1.default(eventPublisher, permissionManager, repository);
                    event = getEvent();
                    webhook = __assign(__assign({}, WEBHOOK_BASE), { responseTopic: 'hook-response/tappt_request-pour-{{SPARK_CORE_ID}}' });
                    manager._callWebhook = sinon_1.default.stub().returns('data');
                    eventPublisher.publish = sinon_1.default.spy(function (_a) {
                        var data = _a.data, name = _a.name, userID = _a.userID;
                        expect(data.toString()).toEqual('data');
                        expect(name).toEqual("hook-response/tappt_request-pour-".concat(event.deviceID, "/0"));
                        expect(userID).toEqual(event.userID);
                    });
                    return [4 /*yield*/, manager.runWebhook(webhook, event)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    test('should compile response body and publish', function () { return __awaiter(void 0, void 0, void 0, function () {
        var manager, event, webhook;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    manager = new WebhookManager_1.default(eventPublisher, permissionManager, repository);
                    event = getEvent();
                    webhook = __assign(__assign({}, WEBHOOK_BASE), { responseTemplate: 'testVar: {{t}}, testVar2: {{g}}' });
                    manager._callWebhook = sinon_1.default.stub().returns({
                        g: 'foobar',
                        t: 123,
                    });
                    eventPublisher.publish = sinon_1.default.spy(function (_a) {
                        var data = _a.data, name = _a.name, userID = _a.userID;
                        expect(data.toString()).toEqual('testVar: 123, testVar2: foobar');
                        expect(name).toEqual("hook-response/".concat(event.name, "/0"));
                        expect(userID).toEqual(event.userID);
                    });
                    return [4 /*yield*/, manager.runWebhook(webhook, event)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=WebhookManager.test.js.map