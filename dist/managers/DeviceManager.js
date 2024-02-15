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
var ec_key_1 = __importDefault(require("ec-key"));
var node_rsa_1 = __importDefault(require("node-rsa"));
var spark_protocol_1 = require("spark-protocol");
var HttpError_1 = __importDefault(require("../lib/HttpError"));
var DeviceManager = /** @class */ (function () {
    function DeviceManager(deviceAttributeRepository, deviceFirmwareRepository, deviceKeyRepository, permissionManager, eventPublisher) {
        this._deviceAttributeRepository = deviceAttributeRepository;
        this._deviceFirmwareRepository = deviceFirmwareRepository;
        this._deviceKeyRepository = deviceKeyRepository;
        this._permissionManager = permissionManager;
        this._eventPublisher = eventPublisher;
    }
    DeviceManager.prototype.claimDevice = function (deviceID, userID) {
        return __awaiter(this, void 0, void 0, function () {
            var attributes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._deviceAttributeRepository.getByID(deviceID)];
                    case 1:
                        attributes = _a.sent();
                        if (!attributes) {
                            return [2 /*return*/, this._deviceAttributeRepository.updateByID(deviceID, {
                                    deviceID: deviceID,
                                    ownerID: userID,
                                    registrar: userID,
                                })];
                        }
                        if (attributes.ownerID && attributes.ownerID !== userID) {
                            throw new HttpError_1.default('The device belongs to someone else.');
                        }
                        if (attributes.ownerID && attributes.ownerID === userID) {
                            throw new HttpError_1.default('The device is already claimed.');
                        }
                        // update connected device attributes
                        return [4 /*yield*/, this._eventPublisher.publishAndListenForResponse({
                                context: { attributes: { ownerID: userID }, deviceID: deviceID },
                                name: spark_protocol_1.SPARK_SERVER_EVENTS.UPDATE_DEVICE_ATTRIBUTES,
                            })];
                    case 2:
                        // update connected device attributes
                        _a.sent();
                        // todo check: we may not need to update attributes in db here.
                        return [2 /*return*/, this._deviceAttributeRepository.updateByID(deviceID, {
                                ownerID: userID,
                            })];
                }
            });
        });
    };
    DeviceManager.prototype.unclaimDevice = function (deviceID) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getByID(deviceID)];
                    case 1:
                        _a.sent();
                        // update connected device attributes
                        return [4 /*yield*/, this._eventPublisher.publishAndListenForResponse({
                                context: { attributes: { ownerID: null }, deviceID: deviceID },
                                name: spark_protocol_1.SPARK_SERVER_EVENTS.UPDATE_DEVICE_ATTRIBUTES,
                            })];
                    case 2:
                        // update connected device attributes
                        _a.sent();
                        return [2 /*return*/, this._deviceAttributeRepository.updateByID(deviceID, {
                                ownerID: null,
                            })];
                }
            });
        });
    };
    DeviceManager.prototype.getAttributesByID = function (deviceID) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.getByID(deviceID)];
            });
        });
    };
    DeviceManager.prototype.getByID = function (deviceID) {
        return __awaiter(this, void 0, void 0, function () {
            var connectedDeviceAttributes, attributes, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this._eventPublisher.publishAndListenForResponse({
                            context: { deviceID: deviceID.toLowerCase() },
                            name: spark_protocol_1.SPARK_SERVER_EVENTS.GET_DEVICE_ATTRIBUTES,
                        })];
                    case 1:
                        connectedDeviceAttributes = _b.sent();
                        if (!(!connectedDeviceAttributes.error &&
                            this._permissionManager.doesUserHaveAccess(connectedDeviceAttributes))) return [3 /*break*/, 2];
                        _a = connectedDeviceAttributes;
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, this._permissionManager.getEntityByID('deviceAttributes', deviceID)];
                    case 3:
                        _a = _b.sent();
                        _b.label = 4;
                    case 4:
                        attributes = _a;
                        if (!attributes) {
                            throw new HttpError_1.default('No device found', 404);
                        }
                        return [2 /*return*/, __assign(__assign({}, attributes), { connected: !connectedDeviceAttributes.error, lastFlashedAppName: null })];
                }
            });
        });
    };
    DeviceManager.prototype.getDeviceID = function (deviceIDorName) {
        return __awaiter(this, void 0, void 0, function () {
            var device, hasPermission;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._deviceAttributeRepository.getByID(deviceIDorName)];
                    case 1:
                        device = _a.sent();
                        if (!(device == null)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this._deviceAttributeRepository.getByName(deviceIDorName)];
                    case 2:
                        device = _a.sent();
                        _a.label = 3;
                    case 3:
                        if (device == null) {
                            throw new HttpError_1.default('No device found', 404);
                        }
                        hasPermission = this._permissionManager.doesUserHaveAccess(device);
                        if (!hasPermission) {
                            throw new HttpError_1.default("User doesn't have access", 403);
                        }
                        return [2 /*return*/, device.deviceID];
                }
            });
        });
    };
    DeviceManager.prototype.getAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            var devicesAttributes, devicePromises;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._permissionManager.getAllEntitiesForCurrentUser('deviceAttributes')];
                    case 1:
                        devicesAttributes = _a.sent();
                        return [4 /*yield*/, Promise.all(devicesAttributes.map(function (attributes) { return __awaiter(_this, void 0, void 0, function () {
                                var pingResponse;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this._eventPublisher.publishAndListenForResponse({
                                                context: { deviceID: attributes.deviceID },
                                                name: spark_protocol_1.SPARK_SERVER_EVENTS.PING_DEVICE,
                                            })];
                                        case 1:
                                            pingResponse = _a.sent();
                                            return [2 /*return*/, __assign(__assign({}, attributes), { connected: pingResponse.connected || false, lastFlashedAppName: null, lastHeard: pingResponse.lastHeard || attributes.lastHeard })];
                                    }
                                });
                            }); }))];
                    case 2:
                        devicePromises = _a.sent();
                        return [2 /*return*/, Promise.all(devicePromises)];
                }
            });
        });
    };
    DeviceManager.prototype.callFunction = function (deviceID, functionName, functionArguments) {
        return __awaiter(this, void 0, void 0, function () {
            var callFunctionResponse, error, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._permissionManager.checkPermissionsForEntityByID('deviceAttributes', deviceID)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this._eventPublisher.publishAndListenForResponse({
                                context: { deviceID: deviceID, functionArguments: functionArguments, functionName: functionName },
                                name: spark_protocol_1.SPARK_SERVER_EVENTS.CALL_DEVICE_FUNCTION,
                            })];
                    case 2:
                        callFunctionResponse = _a.sent();
                        error = callFunctionResponse.error, result = callFunctionResponse.result;
                        if (error) {
                            throw new HttpError_1.default(error);
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    };
    DeviceManager.prototype.getVariableValue = function (deviceID, variableName) {
        return __awaiter(this, void 0, void 0, function () {
            var getVariableResponse, error, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._permissionManager.checkPermissionsForEntityByID('deviceAttributes', deviceID)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this._eventPublisher.publishAndListenForResponse({
                                context: { deviceID: deviceID, variableName: variableName },
                                name: spark_protocol_1.SPARK_SERVER_EVENTS.GET_DEVICE_VARIABLE_VALUE,
                            })];
                    case 2:
                        getVariableResponse = _a.sent();
                        error = getVariableResponse.error, result = getVariableResponse.result;
                        if (error) {
                            throw new HttpError_1.default(error);
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    };
    DeviceManager.prototype.forceFirmwareUpdate = function (deviceID) {
        return __awaiter(this, void 0, void 0, function () {
            var getVariableResponse, error;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._permissionManager.checkPermissionsForEntityByID('deviceAttributes', deviceID)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this._eventPublisher.publishAndListenForResponse({
                                context: { deviceID: deviceID },
                                name: spark_protocol_1.SPARK_SERVER_EVENTS.FORCE_UPDATES_FOR_DEVICE,
                            })];
                    case 2:
                        getVariableResponse = _a.sent();
                        error = getVariableResponse.error;
                        if (error) {
                            throw new HttpError_1.default(error);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    DeviceManager.prototype.flashBinary = function (deviceID, file) {
        return __awaiter(this, void 0, void 0, function () {
            var flashResponse, error;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._permissionManager.checkPermissionsForEntityByID('deviceAttributes', deviceID)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this._eventPublisher.publishAndListenForResponse({
                                context: { deviceID: deviceID, fileBuffer: file.buffer, fileName: file.filename },
                                name: spark_protocol_1.SPARK_SERVER_EVENTS.FLASH_DEVICE,
                            })];
                    case 2:
                        flashResponse = _a.sent();
                        error = flashResponse.error;
                        if (error) {
                            throw new HttpError_1.default(error);
                        }
                        return [2 /*return*/, flashResponse];
                }
            });
        });
    };
    DeviceManager.prototype.flashKnownApp = function (deviceID, appName) {
        return __awaiter(this, void 0, void 0, function () {
            var knownFirmware, flashResponse, error;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._permissionManager.checkPermissionsForEntityByID('deviceAttributes', deviceID)];
                    case 1:
                        _a.sent();
                        knownFirmware = this._deviceFirmwareRepository.getByName(appName);
                        if (!knownFirmware) {
                            throw new HttpError_1.default("No firmware ".concat(appName, " found"), 404);
                        }
                        return [4 /*yield*/, this._eventPublisher.publishAndListenForResponse({
                                context: { deviceID: deviceID, fileBuffer: knownFirmware, fileName: appName },
                                name: spark_protocol_1.SPARK_SERVER_EVENTS.FLASH_DEVICE,
                            })];
                    case 2:
                        flashResponse = _a.sent();
                        error = flashResponse.error;
                        if (error) {
                            throw new HttpError_1.default(error);
                        }
                        return [2 /*return*/, flashResponse];
                }
            });
        });
    };
    DeviceManager.prototype.flashProductFirmware = function (productID, deviceID) {
        if (deviceID === void 0) { deviceID = null; }
        this._eventPublisher.publish({
            context: { deviceID: deviceID, productID: productID },
            name: spark_protocol_1.SPARK_SERVER_EVENTS.FLASH_PRODUCT_FIRMWARE,
        });
    };
    DeviceManager.prototype.ping = function (deviceID) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._permissionManager.checkPermissionsForEntityByID('deviceAttributes', deviceID)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this._eventPublisher.publishAndListenForResponse({
                                context: { deviceID: deviceID },
                                name: spark_protocol_1.SPARK_SERVER_EVENTS.PING_DEVICE,
                            })];
                }
            });
        });
    };
    DeviceManager.prototype.provision = function (deviceID, userID, publicKey, algorithm) {
        return __awaiter(this, void 0, void 0, function () {
            var eccKey, createdKey;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (algorithm === 'ecc') {
                            try {
                                eccKey = new ec_key_1.default(publicKey, 'pem');
                                if (eccKey.isPrivateECKey) {
                                    throw new HttpError_1.default('Not a public key');
                                }
                            }
                            catch (error) {
                                throw new HttpError_1.default("Key error ".concat(error));
                            }
                        }
                        else {
                            try {
                                createdKey = new node_rsa_1.default(publicKey);
                                if (!createdKey.isPublic()) {
                                    throw new HttpError_1.default('Not a public key');
                                }
                            }
                            catch (error) {
                                throw new HttpError_1.default("Key error ".concat(error));
                            }
                        }
                        return [4 /*yield*/, this._deviceKeyRepository.updateByID(deviceID, {
                                algorithm: algorithm,
                                deviceID: deviceID,
                                key: publicKey,
                            })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this._deviceAttributeRepository.updateByID(deviceID, {
                                ownerID: userID,
                                registrar: userID,
                            })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, this.getByID(deviceID)];
                }
            });
        });
    };
    DeviceManager.prototype.raiseYourHand = function (deviceID, shouldShowSignal) {
        return __awaiter(this, void 0, void 0, function () {
            var raiseYourHandResponse, error;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._permissionManager.checkPermissionsForEntityByID('deviceAttributes', deviceID)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this._eventPublisher.publishAndListenForResponse({
                                context: { deviceID: deviceID, shouldShowSignal: shouldShowSignal },
                                name: spark_protocol_1.SPARK_SERVER_EVENTS.RAISE_YOUR_HAND,
                            })];
                    case 2:
                        raiseYourHandResponse = _a.sent();
                        error = raiseYourHandResponse.error;
                        if (error) {
                            throw new HttpError_1.default(error);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    DeviceManager.prototype.renameDevice = function (deviceID, name) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getAttributesByID(deviceID)];
                    case 1:
                        _a.sent();
                        // update connected device attributes
                        return [4 /*yield*/, this._eventPublisher.publishAndListenForResponse({
                                context: { attributes: { name: name }, deviceID: deviceID },
                                name: spark_protocol_1.SPARK_SERVER_EVENTS.UPDATE_DEVICE_ATTRIBUTES,
                            })];
                    case 2:
                        // update connected device attributes
                        _a.sent();
                        return [2 /*return*/, this._deviceAttributeRepository.updateByID(deviceID, { name: name })];
                }
            });
        });
    };
    return DeviceManager;
}());
exports.default = DeviceManager;
//# sourceMappingURL=DeviceManager.js.map