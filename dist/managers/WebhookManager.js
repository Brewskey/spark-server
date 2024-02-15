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
var hogan_js_1 = __importDefault(require("hogan.js"));
var request_1 = __importDefault(require("request"));
var nullthrows_1 = __importDefault(require("nullthrows"));
var throttle_1 = __importDefault(require("lodash/throttle"));
var HttpError_1 = __importDefault(require("../lib/HttpError"));
var settings_1 = __importDefault(require("../settings"));
var logger_1 = __importDefault(require("../lib/logger"));
var logger = logger_1.default.createModuleLogger(module);
var parseEventData = function (event) {
    try {
        if (event.data && typeof event.data === 'string') {
            return JSON.parse(event.data);
        }
        return null;
    }
    catch (error) {
        return null;
    }
};
var splitBufferIntoChunks = function (buffer, chunkSize) {
    var chunks = [];
    var ii = 0;
    while (ii < buffer.length) {
        chunks.push(buffer.slice(ii, (ii += chunkSize)));
    }
    return chunks;
};
var REQUEST_TYPES = ['DELETE', 'GET', 'POST', 'PUT'];
var MAX_WEBHOOK_ERRORS_COUNT = 10;
var WEBHOOK_THROTTLE_TIME = 1000 * 60; // 1min;
var MAX_RESPONSE_MESSAGE_CHUNK_SIZE = 512;
var MAX_RESPONSE_MESSAGE_SIZE = 100000;
var validateRequestType = function (requestType) {
    var upperRequestType = requestType.toUpperCase();
    if (!REQUEST_TYPES.includes(upperRequestType)) {
        throw new HttpError_1.default('wrong requestType');
    }
    return upperRequestType;
};
var WEBHOOK_DEFAULTS = {
    rejectUnauthorized: true,
};
var WebhookManager = /** @class */ (function () {
    function WebhookManager(eventPublisher, permissionManager, webhookRepository) {
        var _this = this;
        this._subscriptionIDsByWebhookID = new Map();
        this._errorsCountByWebhookID = new Map();
        this.runWebhookThrottled = (0, throttle_1.default)(this.runWebhook.bind(this), WEBHOOK_THROTTLE_TIME, {
            leading: false,
            trailing: true,
        });
        this._callWebhook = function (webhook, event, requestOptions) {
            return new Promise(function (resolve, reject) {
                var onResponseError = function (responseError) {
                    _this._incrementWebhookErrorCounter(webhook.id);
                    _this._eventPublisher.publish({
                        data: responseError != null
                            ? responseError.message ||
                                responseError.errorMessage ||
                                ''
                            : '',
                        name: _this._compileErrorResponseTopic(webhook, event),
                        userID: event.userID,
                    }, {
                        isPublic: false,
                    });
                    reject(responseError);
                };
                return (0, request_1.default)(requestOptions, function (error, response, responseBody) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    resolve({});
                    if (error) {
                        onResponseError(error);
                        return;
                    }
                    if (response.statusCode >= 400) {
                        onResponseError(error || new Error(response.statusMessage));
                        return;
                    }
                    _this._resetWebhookErrorCounter(webhook.id);
                    _this._eventPublisher.publish({
                        name: "hook-sent/".concat(event.name),
                        userID: event.userID,
                    }, {
                        isPublic: false,
                    });
                    resolve(responseBody);
                });
            });
        };
        this._getEventVariables = function (event) {
            var defaultWebhookVariables = __assign({ PARTICLE_DEVICE_ID: event.deviceID, PARTICLE_EVENT_NAME: event.name, PARTICLE_EVENT_VALUE: event.data, PARTICLE_PUBLISHED_AT: event.publishedAt, 
                // old event names, added for compatibility
                SPARK_CORE_ID: event.deviceID, SPARK_EVENT_NAME: event.name, SPARK_EVENT_VALUE: event.data, SPARK_PUBLISHED_AT: event.publishedAt }, settings_1.default.WEBHOOK_TEMPLATE_PARAMETERS);
            var eventDataVariables = parseEventData(event);
            return __assign(__assign({}, defaultWebhookVariables), eventDataVariables);
        };
        this._getRequestData = function (customData, event, noDefaults) {
            var defaultEventData = {
                coreid: event.deviceID,
                data: event.data,
                event: event.name,
                published_at: event.publishedAt,
            };
            return noDefaults
                ? customData !== null && customData !== void 0 ? customData : {}
                : __assign(__assign({}, defaultEventData), (customData || {}));
        };
        this._compileTemplate = function (template, variables) {
            return template && hogan_js_1.default.compile(template).render(variables);
        };
        this._compileJsonTemplate = function (template, variables) {
            if (!template) {
                return undefined;
            }
            var compiledTemplate = _this._compileTemplate(JSON.stringify(template), variables);
            if (!compiledTemplate) {
                return undefined;
            }
            return JSON.parse(compiledTemplate);
        };
        this._compileErrorResponseTopic = function (webhook, event) {
            var variables = _this._getEventVariables(event);
            return (_this._compileTemplate(webhook.errorResponseTopic, variables) ||
                "hook-error/".concat(event.name));
        };
        this._incrementWebhookErrorCounter = function (webhookID) {
            var errorsCount = _this._errorsCountByWebhookID.get(webhookID) || 0;
            _this._errorsCountByWebhookID.set(webhookID, errorsCount + 1);
        };
        this._resetWebhookErrorCounter = function (webhookID) {
            _this._errorsCountByWebhookID.set(webhookID, 0);
        };
        this._eventPublisher = eventPublisher;
        this._permissionManager = permissionManager;
        this._webhookRepository = webhookRepository;
        (function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._init()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); })();
    }
    WebhookManager.prototype.create = function (model) {
        return __awaiter(this, void 0, void 0, function () {
            var webhook;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._webhookRepository.create(__assign(__assign({}, WEBHOOK_DEFAULTS), model))];
                    case 1:
                        webhook = _a.sent();
                        this._subscribeWebhook(webhook);
                        return [2 /*return*/, webhook];
                }
            });
        });
    };
    WebhookManager.prototype.deleteByID = function (webhookID) {
        return __awaiter(this, void 0, void 0, function () {
            var webhook;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._permissionManager.getEntityByID('webhook', webhookID)];
                    case 1:
                        webhook = _a.sent();
                        if (!webhook) {
                            throw new HttpError_1.default('no webhook found', 404);
                        }
                        return [4 /*yield*/, this._webhookRepository.deleteByID(webhookID)];
                    case 2:
                        _a.sent();
                        this._unsubscribeWebhookByID(webhookID);
                        return [2 /*return*/];
                }
            });
        });
    };
    WebhookManager.prototype.getAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this._permissionManager.getAllEntitiesForCurrentUser('webhook')];
            });
        });
    };
    WebhookManager.prototype.getByID = function (webhookID) {
        return __awaiter(this, void 0, void 0, function () {
            var webhook;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._permissionManager.getEntityByID('webhook', webhookID)];
                    case 1:
                        webhook = _a.sent();
                        if (!webhook) {
                            throw new HttpError_1.default('no webhook found', 404);
                        }
                        return [2 /*return*/, webhook];
                }
            });
        });
    };
    WebhookManager.prototype._init = function () {
        return __awaiter(this, void 0, void 0, function () {
            var allWebhooks;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._webhookRepository.getAll()];
                    case 1:
                        allWebhooks = _a.sent();
                        allWebhooks.forEach(function (webhook) {
                            return _this._subscribeWebhook(webhook);
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    WebhookManager.prototype._subscribeWebhook = function (webhook) {
        var subscriptionID = this._eventPublisher.subscribe(webhook.event, this._onNewWebhookEvent(webhook), {
            filterOptions: {
                deviceID: webhook.deviceID,
                listenToBroadcastedEvents: false,
                mydevices: webhook.mydevices,
                userID: webhook.ownerID,
            },
        });
        this._subscriptionIDsByWebhookID.set(webhook.id, subscriptionID);
    };
    WebhookManager.prototype._unsubscribeWebhookByID = function (webhookID) {
        var subscriptionID = this._subscriptionIDsByWebhookID.get(webhookID);
        if (!subscriptionID) {
            return;
        }
        this._eventPublisher.unsubscribe(subscriptionID);
        this._subscriptionIDsByWebhookID.delete(webhookID);
    };
    WebhookManager.prototype._onNewWebhookEvent = function (webhook) {
        var _this = this;
        return function (event) { return __awaiter(_this, void 0, void 0, function () {
            var webhookErrorCount;
            return __generator(this, function (_a) {
                try {
                    webhookErrorCount = this._errorsCountByWebhookID.get(webhook.id) || 0;
                    if (webhookErrorCount < MAX_WEBHOOK_ERRORS_COUNT) {
                        this.runWebhook(webhook, event);
                        return [2 /*return*/];
                    }
                    this._eventPublisher.publish({
                        data: 'Too many errors, webhook disabled',
                        name: this._compileErrorResponseTopic(webhook, event),
                        userID: event.userID,
                    }, { isPublic: false });
                    this.runWebhookThrottled(webhook, event);
                }
                catch (error) {
                    logger.error({ deviceID: event.deviceID, err: error, event: event, webhook: webhook }, 'Webhook Error');
                }
                return [2 /*return*/];
            });
        }); };
    };
    WebhookManager.prototype.runWebhook = function (webhook, event) {
        return __awaiter(this, void 0, void 0, function () {
            var webhookVariablesObject, requestAuth, requestJson, requestFormData, requestHeaders, requestUrl, requestQuery, responseTopic_1, requestType, isGetRequest, requestOptions, responseBody, isResponseBodyAnObject, responseTemplate, responseEventData, chunks, error_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        webhookVariablesObject = this._getEventVariables(event);
                        requestAuth = this._compileJsonTemplate(webhook.auth, webhookVariablesObject);
                        requestJson = this._compileJsonTemplate(webhook.json, webhookVariablesObject);
                        requestFormData = this._compileJsonTemplate(webhook.form, webhookVariablesObject);
                        requestHeaders = this._compileJsonTemplate(webhook.headers, webhookVariablesObject);
                        requestUrl = this._compileTemplate(webhook.url, webhookVariablesObject);
                        requestQuery = this._compileJsonTemplate(webhook.query, webhookVariablesObject);
                        responseTopic_1 = this._compileTemplate(webhook.responseTopic, webhookVariablesObject);
                        requestType = this._compileTemplate(webhook.requestType, webhookVariablesObject);
                        isGetRequest = requestType === 'GET';
                        requestOptions = {
                            auth: requestAuth,
                            body: requestJson && !isGetRequest
                                ? this._getRequestData(requestJson, event, webhook.noDefaults)
                                : undefined,
                            form: !requestJson && !isGetRequest
                                ? this._getRequestData(requestFormData, event, webhook.noDefaults) || event.data
                                : undefined,
                            headers: requestHeaders,
                            json: true,
                            method: validateRequestType((0, nullthrows_1.default)(requestType)),
                            qs: isGetRequest
                                ? this._getRequestData(requestQuery, event, webhook.noDefaults)
                                : requestQuery,
                            strictSSL: webhook.rejectUnauthorized,
                            url: (0, nullthrows_1.default)(requestUrl),
                        };
                        return [4 /*yield*/, this._callWebhook(webhook, event, requestOptions)];
                    case 1:
                        responseBody = _a.sent();
                        if (!responseBody) {
                            return [2 /*return*/];
                        }
                        isResponseBodyAnObject = typeof responseBody !== 'string' && !Buffer.isBuffer(responseBody);
                        responseTemplate = (webhook.responseTemplate != null &&
                            isResponseBodyAnObject &&
                            hogan_js_1.default.compile(webhook.responseTemplate).render(responseBody)) ||
                            '';
                        responseEventData = responseTemplate ||
                            (isResponseBodyAnObject ? JSON.stringify(responseBody) : responseBody);
                        chunks = splitBufferIntoChunks((Buffer.isBuffer(responseEventData)
                            ? responseEventData
                            : Buffer.from(responseEventData)).slice(0, MAX_RESPONSE_MESSAGE_SIZE), MAX_RESPONSE_MESSAGE_CHUNK_SIZE);
                        chunks.forEach(function (chunk, index) {
                            var responseEventName = (responseTopic_1 && "".concat(responseTopic_1, "/").concat(index)) ||
                                "hook-response/".concat(event.name, "/").concat(index);
                            _this._eventPublisher.publish({
                                data: chunk.toString(),
                                name: responseEventName,
                                userID: event.userID,
                            }, {
                                isPublic: false,
                            });
                        });
                        logger.info({
                            deviceID: event.deviceID,
                            event: event,
                            name: webhook.event,
                            requestOptions: requestOptions,
                            responseBody: responseBody,
                            webhook: webhook,
                        }, 'Webhook');
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        logger.error({ deviceID: event.deviceID, err: error_1, event: event, webhook: webhook }, 'Webhook Error');
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return WebhookManager;
}());
exports.default = WebhookManager;
//# sourceMappingURL=WebhookManager.js.map