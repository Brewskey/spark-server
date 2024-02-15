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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var collectionNames_1 = __importDefault(require("./collectionNames"));
var BaseRepository_1 = __importDefault(require("./BaseRepository"));
var spark_protocol_1 = require("spark-protocol");
// getByID, deleteByID and update uses model.deviceID as ID for querying
var DeviceAttributeDatabaseRepository = /** @class */ (function (_super) {
    __extends(DeviceAttributeDatabaseRepository, _super);
    function DeviceAttributeDatabaseRepository(database, productDeviceRepository) {
        var _this = _super.call(this, database, collectionNames_1.default.DEVICE_ATTRIBUTES) || this;
        _this._collectionName = collectionNames_1.default.DEVICE_ATTRIBUTES;
        _this.create = function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new Error('The method is not implemented');
            });
        }); };
        _this.deleteByID = function (deviceID) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this._database.remove(this._collectionName, {
                        deviceID: deviceID.toLowerCase(),
                    })];
            });
        }); };
        _this.getAll = function (userID) {
            if (userID === void 0) { userID = null; }
            return __awaiter(_this, void 0, void 0, function () {
                var query;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            query = userID ? { ownerID: userID } : {};
                            return [4 /*yield*/, this._database.find(this._collectionName, query)];
                        case 1: return [2 /*return*/, (_a.sent())
                                .map(this._parseVariables)
                                .filter(spark_protocol_1.filterFalsyValues)];
                    }
                });
            });
        };
        _this.getByID = function (deviceID) { return __awaiter(_this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this._parseVariables;
                        return [4 /*yield*/, this._database.findOne(this._collectionName, {
                                deviceID: deviceID.toLowerCase(),
                            })];
                    case 1: return [2 /*return*/, _a.apply(this, [_b.sent()])];
                }
            });
        }); };
        _this.getByName = function (name) { return __awaiter(_this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this._parseVariables;
                        return [4 /*yield*/, this._database.findOne(this._collectionName, {
                                name: name,
                            })];
                    case 1: return [2 /*return*/, _a.apply(this, [_b.sent()])];
                }
            });
        }); };
        _this.getManyFromIDs = function (deviceIDs, ownerID) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._database.find(this._collectionName, __assign({ deviceID: {
                                $in: deviceIDs.map(function (id) { return id.toLowerCase(); }),
                            } }, (ownerID ? { ownerID: ownerID } : {})))];
                    case 1: // todo  $in operator doesn't work for neDb(no matter with regexp or plain strings)
                    return [2 /*return*/, // todo  $in operator doesn't work for neDb(no matter with regexp or plain strings)
                        (_a.sent())
                            .map(this._parseVariables)
                            .filter(spark_protocol_1.filterFalsyValues)];
                }
            });
        }); };
        _this.updateByID = function (deviceID, _a) { return __awaiter(_this, void 0, void 0, function () {
            var attributesToSave, existingAttributes, productDevice;
            var variables = _a.variables, props = __rest(_a, ["variables"]);
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        attributesToSave = __assign(__assign(__assign({}, props), (variables ? { variables: JSON.stringify(variables) } : {})), { deviceID: deviceID.toLowerCase() });
                        return [4 /*yield*/, this.getByID(deviceID)];
                    case 1:
                        existingAttributes = _b.sent();
                        return [4 /*yield*/, this._productDeviceRepository.getFromDeviceID(deviceID)];
                    case 2:
                        productDevice = _b.sent();
                        if (!productDevice) return [3 /*break*/, 4];
                        productDevice.productFirmwareVersion = existingAttributes
                            ? existingAttributes.productFirmwareVersion
                            : 65535;
                        return [4 /*yield*/, this._productDeviceRepository.updateByID(productDevice.id, productDevice)];
                    case 3:
                        _b.sent();
                        _b.label = 4;
                    case 4: return [2 /*return*/, this._database.findAndModify(this._collectionName, { deviceID: deviceID.toLowerCase() }, { $set: __assign(__assign({}, attributesToSave), { timestamp: new Date() }) })];
                }
            });
        }); };
        // mongo and neDB don't support dots in variables names
        // but some of the server users want to have dots in their device var names
        // so we have to stringify them and parse back.
        _this._parseVariables = function (attributesFromDB) {
            if (!attributesFromDB) {
                return;
            }
            var variables = attributesFromDB.variables;
            try {
                return __assign(__assign({}, attributesFromDB), { variables: variables && typeof variables === 'string'
                        ? JSON.parse(variables)
                        : undefined });
            }
            catch (ignore) {
                return attributesFromDB;
            }
        };
        _this._database = database;
        _this._productDeviceRepository = productDeviceRepository;
        _this.tryCreateIndex({ ownerID: 1 });
        _this.tryCreateIndex({ deviceID: 1 });
        _this.tryCreateIndex({ name: 1 });
        return _this;
    }
    return DeviceAttributeDatabaseRepository;
}(BaseRepository_1.default));
exports.default = DeviceAttributeDatabaseRepository;
//# sourceMappingURL=DeviceAttributeDatabaseRepository.js.map