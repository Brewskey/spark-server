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
var binary_version_reader_1 = require("binary-version-reader");
var Controller_1 = __importDefault(require("./Controller"));
var httpVerb_1 = __importDefault(require("../decorators/httpVerb"));
var allowUpload_1 = __importDefault(require("../decorators/allowUpload"));
var route_1 = __importDefault(require("../decorators/route"));
var nullthrows_1 = __importDefault(require("nullthrows"));
var MISSING_FIELDS = ['binary', 'description', 'title', 'version'];
var ProductFirmwaresController = /** @class */ (function (_super) {
    __extends(ProductFirmwaresController, _super);
    function ProductFirmwaresController(deviceManager, productDeviceRepository, productFirmwareRepository, productRepository) {
        var _this = _super.call(this) || this;
        _this._deviceManager = deviceManager;
        _this._productDeviceRepository = productDeviceRepository;
        _this._productFirmwareRepository = productFirmwareRepository;
        _this._productRepository = productRepository;
        return _this;
    }
    ProductFirmwaresController.prototype.getFirmwares = function (productIDOrSlug) {
        return __awaiter(this, void 0, void 0, function () {
            var product, firmwares, mappedFirmware;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._productRepository.getByIDOrSlug(productIDOrSlug)];
                    case 1:
                        product = _a.sent();
                        if (!product) {
                            return [2 /*return*/, this.bad('Product does not exist', 404)];
                        }
                        return [4 /*yield*/, this._productFirmwareRepository.getManyByProductID(product.product_id)];
                    case 2:
                        firmwares = _a.sent();
                        return [4 /*yield*/, Promise.all(firmwares.map(function (_a) { return __awaiter(_this, void 0, void 0, function () {
                                var deviceCount;
                                var _ = _a.data, firmware = __rest(_a, ["data"]);
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0: return [4 /*yield*/, this._productDeviceRepository.countByProductID(product.product_id, {
                                                productFirmwareVersion: firmware.version,
                                            })];
                                        case 1:
                                            deviceCount = _b.sent();
                                            return [2 /*return*/, __assign(__assign({}, firmware), { device_count: deviceCount })];
                                    }
                                });
                            }); }))];
                    case 3:
                        mappedFirmware = _a.sent();
                        // eslint-disable-next-line no-unused-vars
                        return [2 /*return*/, this.ok(mappedFirmware)];
                }
            });
        });
    };
    ProductFirmwaresController.prototype.getSingleFirmware = function (productIDOrSlug, version) {
        return __awaiter(this, void 0, void 0, function () {
            var product, firmwareList, existingFirmware, deviceCount, _, output;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._productRepository.getByIDOrSlug(productIDOrSlug)];
                    case 1:
                        product = _a.sent();
                        if (!product) {
                            return [2 /*return*/, this.bad("".concat(productIDOrSlug, " does not exist"))];
                        }
                        return [4 /*yield*/, this._productFirmwareRepository.getManyByProductID(product.product_id)];
                    case 2:
                        firmwareList = _a.sent();
                        existingFirmware = firmwareList.find(function (firmware) {
                            return firmware.version === parseInt(version, 10);
                        });
                        if (!existingFirmware) {
                            return [2 /*return*/, this.bad("Firmware version ".concat(version, " does not exist"))];
                        }
                        return [4 /*yield*/, this._productDeviceRepository.countByProductID(product.product_id, {
                                productFirmwareVersion: existingFirmware.version,
                            })];
                    case 3:
                        deviceCount = _a.sent();
                        _ = existingFirmware.data, output = __rest(existingFirmware, ["data"]);
                        return [2 /*return*/, this.ok(__assign(__assign({}, output), { device_count: deviceCount }))];
                }
            });
        });
    };
    ProductFirmwaresController.prototype.addFirmware = function (productIDOrSlug, body) {
        return __awaiter(this, void 0, void 0, function () {
            var missingFields, product, parser, moduleInfo, firmwarePlatformID, _a, productId, productVersion, version, firmwareList, maxExistingFirmwareVersion, firmware, _, output;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        missingFields = MISSING_FIELDS.filter(function (key) { return !body[key]; });
                        if (missingFields.length) {
                            return [2 /*return*/, this.bad("Missing fields: ".concat(missingFields.join(', ')))];
                        }
                        // eslint-disable-next-line no-param-reassign
                        body.current = this._stringToBoolean(body.current);
                        return [4 /*yield*/, this._productRepository.getByIDOrSlug(productIDOrSlug)];
                    case 1:
                        product = _b.sent();
                        if (!product) {
                            return [2 /*return*/, this.bad("".concat(productIDOrSlug, " does not exist"))];
                        }
                        parser = new binary_version_reader_1.HalModuleParser();
                        return [4 /*yield*/, parser.parseBuffer({
                                fileBuffer: body.binary.buffer,
                            })];
                    case 2:
                        moduleInfo = _b.sent();
                        if (!moduleInfo.crc.ok) {
                            return [2 /*return*/, this.bad('Invalid CRC. Try recompiling the firmware')];
                        }
                        firmwarePlatformID = moduleInfo.prefixInfo.platformID;
                        if (firmwarePlatformID !== product.platform_id) {
                            return [2 /*return*/, this.bad("Firmware had incorrect platform ID ".concat(firmwarePlatformID, ". Expected ").concat(product.platform_id, " "))];
                        }
                        _a = moduleInfo.suffixInfo, productId = _a.productId, productVersion = _a.productVersion;
                        if (productId !== parseInt(product.product_id.toString(), 10)) {
                            return [2 /*return*/, this.bad("Firmware had incorrect product ID ".concat(productId, ". Expected  ").concat(product.product_id))];
                        }
                        version = parseInt(body.version.toString(), 10);
                        if (productVersion !== version) {
                            return [2 /*return*/, this.bad("Firmware had incorrect product version ".concat(productVersion, ". Expected ").concat(product.product_id))];
                        }
                        return [4 /*yield*/, this._productFirmwareRepository.getManyByProductID(product.product_id)];
                    case 3:
                        firmwareList = _b.sent();
                        maxExistingFirmwareVersion = Math.max.apply(Math, firmwareList.map(function (firmware) {
                            return parseInt(firmware.version.toString(), 10);
                        }));
                        if (version <= maxExistingFirmwareVersion) {
                            return [2 /*return*/, this.bad("version must be greater than ".concat(maxExistingFirmwareVersion))];
                        }
                        if (!body.current) return [3 /*break*/, 5];
                        return [4 /*yield*/, this._findAndUnreleaseCurrentFirmware(firmwareList)];
                    case 4:
                        _b.sent();
                        _b.label = 5;
                    case 5: return [4 /*yield*/, this._productFirmwareRepository.create({
                            current: body.current,
                            data: body.binary.buffer,
                            description: body.description,
                            device_count: 0,
                            name: body.binary.originalname,
                            product_id: product.product_id,
                            size: body.binary.size,
                            title: body.title,
                            version: version,
                        })];
                    case 6:
                        firmware = _b.sent();
                        if (body.current) {
                            this._deviceManager.flashProductFirmware(product.product_id);
                        }
                        _ = firmware.data, output = __rest(firmware, ["data"]);
                        return [2 /*return*/, this.ok(output)];
                }
            });
        });
    };
    ProductFirmwaresController.prototype.updateFirmware = function (productIDOrSlug, version, body) {
        return __awaiter(this, void 0, void 0, function () {
            var current, description, title, product, firmwareList, existingFirmware, firmware, _, output;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        current = body.current, description = body.description, title = body.title;
                        // eslint-disable-next-line no-param-reassign
                        body = {
                            current: this._stringToBoolean((0, nullthrows_1.default)(current)),
                            description: description,
                            title: title,
                        };
                        return [4 /*yield*/, this._productRepository.getByIDOrSlug(productIDOrSlug)];
                    case 1:
                        product = _a.sent();
                        if (!product) {
                            return [2 /*return*/, this.bad("".concat(productIDOrSlug, " does not exist"))];
                        }
                        return [4 /*yield*/, this._productFirmwareRepository.getManyByProductID(product.product_id)];
                    case 2:
                        firmwareList = _a.sent();
                        existingFirmware = firmwareList.find(function (firmware) {
                            return firmware.version === parseInt(version, 10);
                        });
                        if (!existingFirmware) {
                            return [2 /*return*/, this.bad("Firmware version ".concat(version, " does not exist"))];
                        }
                        if (!body.current) return [3 /*break*/, 4];
                        return [4 /*yield*/, this._findAndUnreleaseCurrentFirmware(firmwareList)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [4 /*yield*/, this._productFirmwareRepository.updateByID(existingFirmware.id, __assign(__assign({}, existingFirmware), body))];
                    case 5:
                        firmware = _a.sent();
                        _ = firmware.data, output = __rest(firmware, ["data"]);
                        if (current) {
                            this._deviceManager.flashProductFirmware(product.product_id);
                        }
                        return [2 /*return*/, this.ok(output)];
                }
            });
        });
    };
    ProductFirmwaresController.prototype.deleteFirmware = function (productIDOrSlug, version) {
        return __awaiter(this, void 0, void 0, function () {
            var product, firmwareList, existingFirmware;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._productRepository.getByIDOrSlug(productIDOrSlug)];
                    case 1:
                        product = _a.sent();
                        if (!product) {
                            return [2 /*return*/, this.bad("".concat(productIDOrSlug, " does not exist"))];
                        }
                        return [4 /*yield*/, this._productFirmwareRepository.getManyByProductID(product.product_id)];
                    case 2:
                        firmwareList = _a.sent();
                        existingFirmware = firmwareList.find(function (firmware) {
                            return firmware.version === parseInt(version, 10);
                        });
                        if (!existingFirmware) {
                            return [2 /*return*/, this.bad("Firmware version ".concat(version, " does not exist"))];
                        }
                        return [4 /*yield*/, this._productFirmwareRepository.deleteByID(existingFirmware.id)];
                    case 3:
                        _a.sent();
                        return [2 /*return*/, this.ok()];
                }
            });
        });
    };
    ProductFirmwaresController.prototype._findAndUnreleaseCurrentFirmware = function (productFirmwareList) {
        var _this = this;
        return Promise.all(productFirmwareList
            .filter(function (firmware) { return firmware.current === true; })
            .map(function (releasedFirmware) {
            return _this._productFirmwareRepository.updateByID(releasedFirmware.id, __assign(__assign({}, releasedFirmware), { current: false }));
        }));
    };
    ProductFirmwaresController.prototype._stringToBoolean = function (input) {
        if (input === true || input === false) {
            return input;
        }
        switch (input.toLowerCase().trim()) {
            case 'true':
            case 'yes':
            case '1':
                return true;
            case 'false':
            case 'no':
            case '0':
            case null:
                return false;
            default:
                return Boolean(input);
        }
    };
    __decorate([
        (0, httpVerb_1.default)('get'),
        (0, route_1.default)('/v1/products/:productIDOrSlug/firmware')
    ], ProductFirmwaresController.prototype, "getFirmwares", null);
    __decorate([
        (0, httpVerb_1.default)('get'),
        (0, route_1.default)('/v1/products/:productIDOrSlug/firmware/:version')
    ], ProductFirmwaresController.prototype, "getSingleFirmware", null);
    __decorate([
        (0, httpVerb_1.default)('post'),
        (0, route_1.default)('/v1/products/:productIDOrSlug/firmware'),
        (0, allowUpload_1.default)('binary', 1)
    ], ProductFirmwaresController.prototype, "addFirmware", null);
    __decorate([
        (0, httpVerb_1.default)('put'),
        (0, route_1.default)('/v1/products/:productIDOrSlug/firmware/:version')
    ], ProductFirmwaresController.prototype, "updateFirmware", null);
    __decorate([
        (0, httpVerb_1.default)('delete'),
        (0, route_1.default)('/v1/products/:productIDOrSlug/firmware/:version')
    ], ProductFirmwaresController.prototype, "deleteFirmware", null);
    return ProductFirmwaresController;
}(Controller_1.default));
exports.default = ProductFirmwaresController;
//# sourceMappingURL=ProductFirmwaresController.js.map