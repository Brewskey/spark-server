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
var Controller_1 = __importDefault(require("./Controller"));
var httpVerb_1 = __importDefault(require("../decorators/httpVerb"));
var route_1 = __importDefault(require("../decorators/route"));
var ProductFirmwaresControllerV2 = /** @class */ (function (_super) {
    __extends(ProductFirmwaresControllerV2, _super);
    function ProductFirmwaresControllerV2(deviceManager, productDeviceRepository, productFirmwareRepository, productRepository) {
        var _this = _super.call(this) || this;
        _this._deviceManager = deviceManager;
        _this._productDeviceRepository = productDeviceRepository;
        _this._productFirmwareRepository = productFirmwareRepository;
        _this._productRepository = productRepository;
        return _this;
    }
    ProductFirmwaresControllerV2.prototype.countFirmwares = function (productIDOrSlug) {
        return __awaiter(this, void 0, void 0, function () {
            var product, count;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._productRepository.getByIDOrSlug(productIDOrSlug)];
                    case 1:
                        product = _a.sent();
                        if (!product) {
                            return [2 /*return*/, this.bad("".concat(productIDOrSlug, " does not exist"))];
                        }
                        return [4 /*yield*/, this._productFirmwareRepository.countByProductID(product.product_id)];
                    case 2:
                        count = _a.sent();
                        return [2 /*return*/, this.ok(count)];
                }
            });
        });
    };
    ProductFirmwaresControllerV2.prototype.getFirmwares = function (productIDOrSlug) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, skip, take, product, firmwares, mappedFirmware;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this.request.query, skip = _a.skip, take = _a.take;
                        return [4 /*yield*/, this._productRepository.getByIDOrSlug(productIDOrSlug)];
                    case 1:
                        product = _b.sent();
                        if (!product) {
                            return [2 /*return*/, this.bad('Product does not exist', 404)];
                        }
                        return [4 /*yield*/, this._productFirmwareRepository.getManyByProductID(product.product_id, { skip: skip, take: take })];
                    case 2:
                        firmwares = _b.sent();
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
                        mappedFirmware = _b.sent();
                        return [2 /*return*/, this.ok(mappedFirmware)];
                }
            });
        });
    };
    ProductFirmwaresControllerV2.prototype.getFirmware = function (productIDOrSlug, firmwareID) {
        return __awaiter(this, void 0, void 0, function () {
            var product, firmware, deviceCount, _, restFirmware;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._productRepository.getByIDOrSlug(productIDOrSlug)];
                    case 1:
                        product = _a.sent();
                        if (!product) {
                            return [2 /*return*/, this.bad("".concat(productIDOrSlug, " does not exist"))];
                        }
                        return [4 /*yield*/, this._productFirmwareRepository.getByID(firmwareID)];
                    case 2:
                        firmware = _a.sent();
                        if (!firmware) {
                            return [2 /*return*/, this.bad("Firmware ".concat(firmwareID, " doesn't exist."))];
                        }
                        return [4 /*yield*/, this._productDeviceRepository.countByProductID(product.product_id, {
                                productFirmwareVersion: firmware.version,
                            })];
                    case 3:
                        deviceCount = _a.sent();
                        _ = firmware.data, restFirmware = __rest(firmware, ["data"]);
                        return [2 /*return*/, this.ok(__assign(__assign({}, restFirmware), { device_count: deviceCount }))];
                }
            });
        });
    };
    __decorate([
        (0, httpVerb_1.default)('get'),
        (0, route_1.default)('/v2/products/:productIDOrSlug/firmwares/count')
    ], ProductFirmwaresControllerV2.prototype, "countFirmwares", null);
    __decorate([
        (0, httpVerb_1.default)('get'),
        (0, route_1.default)('/v2/products/:productIDOrSlug/firmwares')
    ], ProductFirmwaresControllerV2.prototype, "getFirmwares", null);
    __decorate([
        (0, httpVerb_1.default)('get'),
        (0, route_1.default)('/v2/products/:productIDOrSlug/firmwares/:firmwareID')
    ], ProductFirmwaresControllerV2.prototype, "getFirmware", null);
    return ProductFirmwaresControllerV2;
}(Controller_1.default));
exports.default = ProductFirmwaresControllerV2;
//# sourceMappingURL=ProductFirmwaresControllerV2.js.map