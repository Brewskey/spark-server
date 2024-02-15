"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
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
var nullthrows_1 = __importDefault(require("nullthrows"));
var Controller_1 = __importDefault(require("./Controller"));
var HttpError_1 = __importDefault(require("../lib/HttpError"));
var FirmwareCompilationManager_1 = __importDefault(require("../managers/FirmwareCompilationManager"));
var allowUpload_1 = __importDefault(require("../decorators/allowUpload"));
var httpVerb_1 = __importDefault(require("../decorators/httpVerb"));
var route_1 = __importDefault(require("../decorators/route"));
var deviceToAPI_1 = __importDefault(require("../lib/deviceToAPI"));
var logger_1 = __importDefault(require("../lib/logger"));
var logger = logger_1.default.createModuleLogger(module);
var DevicesController = /** @class */ (function (_super) {
    __extends(DevicesController, _super);
    function DevicesController(deviceManager) {
        var _this = _super.call(this) || this;
        _this._deviceManager = deviceManager;
        return _this;
    }
    DevicesController.prototype.claimDevice = function (postBody) {
        return __awaiter(this, void 0, void 0, function () {
            var deviceID, _1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        deviceID = postBody.id;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this._deviceManager.getDeviceID(deviceID)];
                    case 2:
                        deviceID = _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        _1 = _a.sent();
                        return [3 /*break*/, 4];
                    case 4: return [4 /*yield*/, this._deviceManager.claimDevice(deviceID, this.user.id)];
                    case 5:
                        _a.sent();
                        return [2 /*return*/, this.ok({ ok: true })];
                }
            });
        });
    };
    DevicesController.prototype.getAppFirmware = function (binaryID) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.ok(FirmwareCompilationManager_1.default.getBinaryForID(binaryID))];
            });
        });
    };
    DevicesController.prototype.compileSources = function (postBody) {
        return __awaiter(this, void 0, void 0, function () {
            var files, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        files = this.request.files;
                        if (!files) {
                            return [2 /*return*/, this.bad('No files were uploaded')];
                        }
                        return [4 /*yield*/, FirmwareCompilationManager_1.default.compileSource((0, nullthrows_1.default)(postBody.platform_id || postBody.product_id), Array.isArray(files) ? files : Object.values(files).flat())];
                    case 1:
                        response = _a.sent();
                        if (!response) {
                            throw new HttpError_1.default('Error during compilation');
                        }
                        return [2 /*return*/, this.ok(__assign(__assign({}, response), { binary_url: "/v1/binaries/".concat(response.binary_id), ok: true }))];
                }
            });
        });
    };
    DevicesController.prototype.unclaimDevice = function (deviceIDorName) {
        return __awaiter(this, void 0, void 0, function () {
            var deviceID;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._deviceManager.getDeviceID(deviceIDorName)];
                    case 1:
                        deviceID = _a.sent();
                        return [4 /*yield*/, this._deviceManager.unclaimDevice(deviceID)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, this.ok({ ok: true })];
                }
            });
        });
    };
    DevicesController.prototype.getDevices = function () {
        return __awaiter(this, void 0, void 0, function () {
            var devices, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this._deviceManager.getAll()];
                    case 1:
                        devices = _a.sent();
                        return [2 /*return*/, this.ok(devices.map(function (device) { return (0, deviceToAPI_1.default)(device); }))];
                    case 2:
                        error_1 = _a.sent();
                        // I wish we could return no devices found but meh :/
                        // at least we should issue a warning
                        logger.warn({ err: error_1 }, 'get devices throws error, possibly no devices found?');
                        return [2 /*return*/, this.ok([])];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    DevicesController.prototype.getDevice = function (deviceIDorName) {
        return __awaiter(this, void 0, void 0, function () {
            var deviceID, device;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._deviceManager.getDeviceID(deviceIDorName)];
                    case 1:
                        deviceID = _a.sent();
                        return [4 /*yield*/, this._deviceManager.getByID(deviceID)];
                    case 2:
                        device = _a.sent();
                        return [2 /*return*/, this.ok((0, deviceToAPI_1.default)(device))];
                }
            });
        });
    };
    DevicesController.prototype.getVariableValue = function (deviceIDorName, varName) {
        return __awaiter(this, void 0, void 0, function () {
            var deviceID, varValue, error_2, errorMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this._deviceManager.getDeviceID(deviceIDorName)];
                    case 1:
                        deviceID = _a.sent();
                        return [4 /*yield*/, this._deviceManager.getVariableValue(deviceID, varName)];
                    case 2:
                        varValue = _a.sent();
                        return [2 /*return*/, this.ok({ result: varValue })];
                    case 3:
                        error_2 = _a.sent();
                        errorMessage = error_2 instanceof Error ? error_2.message : JSON.stringify(error_2);
                        if (errorMessage.match('Variable not found')) {
                            throw new HttpError_1.default('Variable not found', 404);
                        }
                        throw error_2;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    DevicesController.prototype.updateDevice = function (deviceIDorName, postBody) {
        return __awaiter(this, void 0, void 0, function () {
            var deviceID, updatedAttributes, flashResult, file, originalname, flashResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._deviceManager.getDeviceID(deviceIDorName)];
                    case 1:
                        deviceID = _a.sent();
                        if (!postBody.name) return [3 /*break*/, 3];
                        return [4 /*yield*/, this._deviceManager.renameDevice(deviceID, postBody.name)];
                    case 2:
                        updatedAttributes = _a.sent();
                        return [2 /*return*/, this.ok({ name: updatedAttributes.name, ok: true })];
                    case 3:
                        if (!postBody.signal) return [3 /*break*/, 5];
                        if (!['1', '0'].includes(postBody.signal)) {
                            throw new HttpError_1.default('Wrong signal value');
                        }
                        return [4 /*yield*/, this._deviceManager.raiseYourHand(deviceID, !!parseInt(postBody.signal, 10))];
                    case 4:
                        _a.sent();
                        return [2 /*return*/, this.ok({ id: deviceID, ok: true })];
                    case 5:
                        if (!postBody.app_id) return [3 /*break*/, 7];
                        return [4 /*yield*/, this._deviceManager.flashKnownApp(deviceID, postBody.app_id)];
                    case 6:
                        flashResult = _a.sent();
                        return [2 /*return*/, this.ok({ id: deviceID, status: flashResult.status })];
                    case 7:
                        file = postBody.file;
                        if (!file) {
                            throw new Error('Firmware file not provided');
                        }
                        originalname = file.originalname;
                        if (!(originalname === 'binary' || originalname.endsWith('.bin'))) return [3 /*break*/, 9];
                        return [4 /*yield*/, this._deviceManager.flashBinary(deviceID, file)];
                    case 8:
                        flashResult = _a.sent();
                        return [2 /*return*/, this.ok({ id: deviceID, status: flashResult.status })];
                    case 9: throw new HttpError_1.default('Did not update device');
                }
            });
        });
    };
    DevicesController.prototype.callDeviceFunction = function (deviceIDorName, functionName, postBody) {
        return __awaiter(this, void 0, void 0, function () {
            var deviceID, result, device, error_3, errorMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, this._deviceManager.getDeviceID(deviceIDorName)];
                    case 1:
                        deviceID = _a.sent();
                        return [4 /*yield*/, this._deviceManager.callFunction(deviceID, functionName, postBody)];
                    case 2:
                        result = _a.sent();
                        return [4 /*yield*/, this._deviceManager.getByID(deviceID)];
                    case 3:
                        device = _a.sent();
                        return [2 /*return*/, this.ok((0, deviceToAPI_1.default)(device, result))];
                    case 4:
                        error_3 = _a.sent();
                        errorMessage = error_3 instanceof Error ? error_3.message : JSON.stringify(error_3);
                        if (errorMessage.indexOf('Unknown Function') >= 0) {
                            throw new HttpError_1.default('Function not found', 404);
                        }
                        throw error_3;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    DevicesController.prototype.pingDevice = function (deviceIDorName) {
        return __awaiter(this, void 0, void 0, function () {
            var deviceID, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this._deviceManager.getDeviceID(deviceIDorName)];
                    case 1:
                        deviceID = _b.sent();
                        _a = this.ok;
                        return [4 /*yield*/, this._deviceManager.ping(deviceID)];
                    case 2: return [2 /*return*/, _a.apply(this, [_b.sent()])];
                }
            });
        });
    };
    __decorate([
        (0, httpVerb_1.default)('post'),
        (0, route_1.default)('/v1/devices')
    ], DevicesController.prototype, "claimDevice", null);
    __decorate([
        (0, httpVerb_1.default)('get'),
        (0, route_1.default)('/v1/binaries/:binaryID')
    ], DevicesController.prototype, "getAppFirmware", null);
    __decorate([
        (0, httpVerb_1.default)('post'),
        (0, route_1.default)('/v1/binaries'),
        (0, allowUpload_1.default)()
    ], DevicesController.prototype, "compileSources", null);
    __decorate([
        (0, httpVerb_1.default)('delete'),
        (0, route_1.default)('/v1/devices/:deviceIDorName')
    ], DevicesController.prototype, "unclaimDevice", null);
    __decorate([
        (0, httpVerb_1.default)('get'),
        (0, route_1.default)('/v1/devices')
    ], DevicesController.prototype, "getDevices", null);
    __decorate([
        (0, httpVerb_1.default)('get'),
        (0, route_1.default)('/v1/devices/:deviceIDorName')
    ], DevicesController.prototype, "getDevice", null);
    __decorate([
        (0, httpVerb_1.default)('get'),
        (0, route_1.default)('/v1/devices/:deviceIDorName/:varName/')
    ], DevicesController.prototype, "getVariableValue", null);
    __decorate([
        (0, httpVerb_1.default)('put'),
        (0, route_1.default)('/v1/devices/:deviceIDorName'),
        (0, allowUpload_1.default)('file', 1)
    ], DevicesController.prototype, "updateDevice", null);
    __decorate([
        (0, httpVerb_1.default)('post'),
        (0, route_1.default)('/v1/devices/:deviceIDorName/:functionName')
    ], DevicesController.prototype, "callDeviceFunction", null);
    __decorate([
        (0, httpVerb_1.default)('put'),
        (0, route_1.default)('/v1/devices/:deviceIDorName/ping')
    ], DevicesController.prototype, "pingDevice", null);
    return DevicesController;
}(Controller_1.default));
exports.default = DevicesController;
//# sourceMappingURL=DevicesController.js.map