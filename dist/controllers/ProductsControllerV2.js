"use strict";
/* eslint-disable */
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
var deviceToAPI_1 = __importDefault(require("../lib/deviceToAPI"));
var MISSING_FIELDS = [
    'description',
    'hardware_version',
    'name',
    'platform_id',
    'type',
];
var PUT_MISSING_FIELDS = [
    'config_id',
    'description',
    'hardware_version',
    'id',
    'name',
    'organization',
    'platform_id',
    'type',
];
var ProductsControllerV2 = /** @class */ (function (_super) {
    __extends(ProductsControllerV2, _super);
    function ProductsControllerV2(deviceManager, deviceAttributeRepository, organizationRepository, productRepository, productConfigRepository, productDeviceRepository, productFirmwareRepository) {
        var _this = _super.call(this) || this;
        _this._deviceManager = deviceManager;
        _this._deviceAttributeRepository = deviceAttributeRepository;
        _this._organizationRepository = organizationRepository;
        _this._productConfigRepository = productConfigRepository;
        _this._productDeviceRepository = productDeviceRepository;
        _this._productFirmwareRepository = productFirmwareRepository;
        _this._productRepository = productRepository;
        return _this;
    }
    ProductsControllerV2.prototype.countProducts = function () {
        return __awaiter(this, void 0, void 0, function () {
            var count;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._productRepository.count()];
                    case 1:
                        count = _a.sent();
                        return [2 /*return*/, this.ok(count)];
                }
            });
        });
    };
    ProductsControllerV2.prototype.getProducts = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, skip, take, products;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this.request.query, skip = _a.skip, take = _a.take;
                        return [4 /*yield*/, this._productRepository.getMany(null, {
                                skip: skip,
                                take: take,
                            })];
                    case 1:
                        products = _b.sent();
                        return [2 /*return*/, this.ok(products.map(function (product) { return _this._formatProduct(product); }))];
                }
            });
        });
    };
    ProductsControllerV2.prototype.createProduct = function (productModel) {
        return __awaiter(this, void 0, void 0, function () {
            var missingFields, organizations, organizationID, product, config;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!productModel) {
                            return [2 /*return*/, this.bad('You must provide a product')];
                        }
                        missingFields = MISSING_FIELDS.filter(function (key) { return !productModel[key] && productModel[key] !== 0; });
                        if (missingFields.length) {
                            return [2 /*return*/, this.bad("Missing fields: ".concat(missingFields.join(', ')))];
                        }
                        return [4 /*yield*/, this._organizationRepository.getByUserID(this.user.id)];
                    case 1:
                        organizations = _a.sent();
                        if (!organizations.length) {
                            return [2 /*return*/, this.bad("You don't have access to any organizations")];
                        }
                        organizationID = organizations[0].id;
                        productModel.organization = organizationID;
                        return [4 /*yield*/, this._productRepository.create(productModel)];
                    case 2:
                        product = _a.sent();
                        return [4 /*yield*/, this._productConfigRepository.create({
                                org_id: organizationID,
                                product_id: product.id,
                            })];
                    case 3:
                        config = _a.sent();
                        product.config_id = config.id;
                        return [4 /*yield*/, this._productRepository.updateByID(product.id, product)];
                    case 4:
                        _a.sent();
                        return [2 /*return*/, this.ok(this._formatProduct(product))];
                }
            });
        });
    };
    ProductsControllerV2.prototype.getProduct = function (productIDOrSlug) {
        return __awaiter(this, void 0, void 0, function () {
            var product;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._productRepository.getByIDOrSlug(productIDOrSlug)];
                    case 1:
                        product = _a.sent();
                        if (!product) {
                            return [2 /*return*/, this.bad('Product does not exist', 404)];
                        }
                        return [2 /*return*/, this.ok(this._formatProduct(product))];
                }
            });
        });
    };
    ProductsControllerV2.prototype.updateProduct = function (productIDOrSlug, productModel) {
        return __awaiter(this, void 0, void 0, function () {
            var missingFields, product;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!productModel) {
                            return [2 /*return*/, this.bad('You must provide a product')];
                        }
                        missingFields = PUT_MISSING_FIELDS.filter(function (key) { return !productModel[key] && productModel[key] !== 0; });
                        if (missingFields.length) {
                            return [2 /*return*/, this.bad("Missing fields: ".concat(missingFields.join(', ')))];
                        }
                        return [4 /*yield*/, this._productRepository.getByIDOrSlug(productIDOrSlug)];
                    case 1:
                        product = _a.sent();
                        if (!product) {
                            return [2 /*return*/, this.bad("Product ".concat(productIDOrSlug, " doesn't exist"))];
                        }
                        return [4 /*yield*/, this._productRepository.updateByID(product.id, __assign(__assign({}, product), productModel))];
                    case 2:
                        product = _a.sent();
                        return [2 /*return*/, this.ok(this._formatProduct(product))];
                }
            });
        });
    };
    ProductsControllerV2.prototype.countDevices = function (productIDOrSlug) {
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
                        return [4 /*yield*/, this._productDeviceRepository.countByProductID(product.product_id)];
                    case 2:
                        count = _a.sent();
                        return [2 /*return*/, this.ok(count)];
                }
            });
        });
    };
    ProductsControllerV2.prototype.getDevices = function (productIDOrSlug) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, skip, take, product, productDevices, deviceIDs, deviceAttributesList, devices;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this.request.query, skip = _a.skip, take = _a.take;
                        return [4 /*yield*/, this._productRepository.getByIDOrSlug(productIDOrSlug)];
                    case 1:
                        product = _b.sent();
                        if (!product) {
                            return [2 /*return*/, this.bad("".concat(productIDOrSlug, " does not exist"))];
                        }
                        return [4 /*yield*/, this._productDeviceRepository.getManyByProductID(product.product_id, { skip: skip, take: take })];
                    case 2:
                        productDevices = _b.sent();
                        deviceIDs = productDevices.map(function (productDevice) { return productDevice.deviceID; });
                        return [4 /*yield*/, this._deviceAttributeRepository.getManyFromIDs(deviceIDs)];
                    case 3:
                        deviceAttributesList = _b.sent();
                        devices = productDevices.map(function (_a) {
                            var deviceID = _a.deviceID, other = __rest(_a, ["deviceID"]);
                            var deviceAttributes = deviceAttributesList.find(function (item) { return deviceID === item.deviceID; });
                            return __assign(__assign(__assign({}, (0, deviceToAPI_1.default)(deviceAttributes)), other), { id: deviceID, product_id: product.product_id });
                        });
                        return [2 /*return*/, this.ok(devices)];
                }
            });
        });
    };
    ProductsControllerV2.prototype._formatProduct = function (product) {
        var product_id = product.product_id, output = __rest(product, ["product_id"]);
        output.id = product_id;
        return output;
    };
    ProductsControllerV2.prototype._findAndUnreleaseCurrentFirmware = function (productFirmwareList) {
        var _this = this;
        return Promise.all(productFirmwareList
            .filter(function (firmware) { return firmware.current === true; })
            .map(function (releasedFirmware) {
            return _this._productFirmwareRepository.updateByID(releasedFirmware.id, __assign(__assign({}, releasedFirmware), { current: false }));
        }));
    };
    ProductsControllerV2.prototype._stringToBoolean = function (input) {
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
        (0, route_1.default)('/v2/products/count')
    ], ProductsControllerV2.prototype, "countProducts", null);
    __decorate([
        (0, httpVerb_1.default)('get'),
        (0, route_1.default)('/v2/products')
    ], ProductsControllerV2.prototype, "getProducts", null);
    __decorate([
        (0, httpVerb_1.default)('post'),
        (0, route_1.default)('/v2/products')
    ], ProductsControllerV2.prototype, "createProduct", null);
    __decorate([
        (0, httpVerb_1.default)('get'),
        (0, route_1.default)('/v2/products/:productIDOrSlug')
    ], ProductsControllerV2.prototype, "getProduct", null);
    __decorate([
        (0, httpVerb_1.default)('put'),
        (0, route_1.default)('/v2/products/:productIDOrSlug')
    ], ProductsControllerV2.prototype, "updateProduct", null);
    __decorate([
        (0, httpVerb_1.default)('get'),
        (0, route_1.default)('/v2/products/:productIDOrSlug/devices/count')
    ], ProductsControllerV2.prototype, "countDevices", null);
    __decorate([
        (0, httpVerb_1.default)('get'),
        (0, route_1.default)('/v2/products/:productIDOrSlug/devices')
    ], ProductsControllerV2.prototype, "getDevices", null);
    return ProductsControllerV2;
}(Controller_1.default));
exports.default = ProductsControllerV2;
/* eslint-enable */
//# sourceMappingURL=ProductsControllerV2.js.map