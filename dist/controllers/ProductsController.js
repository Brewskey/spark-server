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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var Controller_1 = __importDefault(require("./Controller"));
var allowUpload_1 = __importDefault(require("../decorators/allowUpload"));
var csv_1 = __importDefault(require("csv"));
var httpVerb_1 = __importDefault(require("../decorators/httpVerb"));
var route_1 = __importDefault(require("../decorators/route"));
var HttpError_1 = __importDefault(require("../lib/HttpError"));
var deviceToAPI_1 = __importDefault(require("../lib/deviceToAPI"));
var POST_MISSING_FIELDS = [
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
var ProductsController = /** @class */ (function (_super) {
    __extends(ProductsController, _super);
    function ProductsController(deviceManager, deviceAttributeRepository, organizationRepository, productRepository, productConfigRepository, productDeviceRepository, productFirmwareRepository) {
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
    ProductsController.prototype.getProducts = function () {
        return __awaiter(this, void 0, void 0, function () {
            var products;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._productRepository.getAll()];
                    case 1:
                        products = _a.sent();
                        return [2 /*return*/, this.ok({
                                products: products.map(function (product) { return _this._formatProduct(product); }),
                            })];
                }
            });
        });
    };
    ProductsController.prototype.createProduct = function (model) {
        return __awaiter(this, void 0, void 0, function () {
            var missingFields, organizations, organizationID, product, config;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!model.product) {
                            return [2 /*return*/, this.bad('You must provide a product')];
                        }
                        missingFields = POST_MISSING_FIELDS.filter(function (key) { return !model.product[key] && model.product[key] !== 0; });
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
                        model.product.organization = organizationID;
                        return [4 /*yield*/, this._productRepository.create(model.product)];
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
                        // For some reason the spark API returns it in an array.
                        return [2 /*return*/, this.ok({ product: [this._formatProduct(product)] })];
                }
            });
        });
    };
    ProductsController.prototype.getProduct = function (productIDOrSlug) {
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
                        return [2 /*return*/, this.ok({ product: [this._formatProduct(product)] })];
                }
            });
        });
    };
    ProductsController.prototype.updateProduct = function (productIDOrSlug, model) {
        return __awaiter(this, void 0, void 0, function () {
            var missingFields, product;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!model.product) {
                            return [2 /*return*/, this.bad('You must provide a product')];
                        }
                        missingFields = PUT_MISSING_FIELDS.filter(function (key) { return !model.product[key] && model.product[key] !== 0; });
                        if (missingFields.length) {
                            return [2 /*return*/, this.bad("Missing fields: ".concat(missingFields.join(', ')))];
                        }
                        return [4 /*yield*/, this._productRepository.getByIDOrSlug(productIDOrSlug)];
                    case 1:
                        product = _a.sent();
                        if (!product) {
                            return [2 /*return*/, this.bad("Product ".concat(productIDOrSlug, " doesn't exist"))];
                        }
                        return [4 /*yield*/, this._productRepository.updateByID(product.id, __assign(__assign({}, product), model.product))];
                    case 2:
                        product = _a.sent();
                        // For some reason the spark API returns it in an array.
                        return [2 /*return*/, this.ok({ product: [this._formatProduct(product)] })];
                }
            });
        });
    };
    ProductsController.prototype.deleteProduct = function (productIDOrSlug) {
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
                        return [4 /*yield*/, this._productRepository.deleteByID(product.id)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this._productFirmwareRepository.deleteByProductID(product.id)];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, this._productDeviceRepository.deleteByProductID(product.id)];
                    case 4:
                        _a.sent();
                        return [2 /*return*/, this.ok()];
                }
            });
        });
    };
    ProductsController.prototype.getConfig = function (productIDOrSlug) {
        return __awaiter(this, void 0, void 0, function () {
            var product, config;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._productRepository.getByIDOrSlug(productIDOrSlug)];
                    case 1:
                        product = _a.sent();
                        if (!product) {
                            return [2 /*return*/, this.bad('Product does not exist', 404)];
                        }
                        return [4 /*yield*/, this._productConfigRepository.getByProductID(product.product_id)];
                    case 2:
                        config = _a.sent();
                        return [2 /*return*/, this.ok({ product_configuration: config })];
                }
            });
        });
    };
    ProductsController.prototype.getDevices = function (productIDOrSlug) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, page, _b, page_size, product, totalDevices, productDevices, deviceIDs, deviceAttributesList, devices;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = this.request.query, page = _a.page, _b = _a.page_size, page_size = _b === void 0 ? '25' : _b;
                        return [4 /*yield*/, this._productRepository.getByIDOrSlug(productIDOrSlug)];
                    case 1:
                        product = _c.sent();
                        if (!product) {
                            return [2 /*return*/, this.bad("".concat(productIDOrSlug, " does not exist"))];
                        }
                        return [4 /*yield*/, this._productDeviceRepository.count({
                                productID: product.product_id,
                            })];
                    case 2:
                        totalDevices = _c.sent();
                        return [4 /*yield*/, this._productDeviceRepository.getManyByProductID(product.product_id, {
                                skip: Math.max(1, page) - 1,
                                take: parseInt(page_size.toString(), 10),
                            })];
                    case 3:
                        productDevices = _c.sent();
                        deviceIDs = productDevices.map(function (productDevice) { return productDevice.deviceID; });
                        return [4 /*yield*/, this._deviceAttributeRepository.getManyFromIDs(deviceIDs)];
                    case 4:
                        deviceAttributesList = _c.sent();
                        devices = productDevices.map(function (_a) {
                            var deviceID = _a.deviceID, other = __rest(_a, ["deviceID"]);
                            var deviceAttributes = deviceAttributesList.find(function (item) { return deviceID === item.deviceID; });
                            return __assign(__assign(__assign({}, (0, deviceToAPI_1.default)(deviceAttributes)), other), { id: deviceID, product_id: product.product_id });
                        });
                        return [2 /*return*/, this.ok({
                                accounts: [],
                                devices: devices,
                                meta: {
                                    total_pages: Math.ceil(totalDevices / parseInt(page_size.toString(), 10)),
                                },
                            })];
                }
            });
        });
    };
    ProductsController.prototype.getSingleDevice = function (productIDOrSlug, deviceIDorName) {
        return __awaiter(this, void 0, void 0, function () {
            var deviceID, product, deviceAttributes, productDevice;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._deviceManager.getDeviceID(deviceIDorName)];
                    case 1:
                        deviceID = _a.sent();
                        return [4 /*yield*/, this._productRepository.getByIDOrSlug(productIDOrSlug)];
                    case 2:
                        product = _a.sent();
                        if (!product) {
                            return [2 /*return*/, this.bad("".concat(productIDOrSlug, " does not exist"))];
                        }
                        return [4 /*yield*/, this._deviceAttributeRepository.getByID(deviceID)];
                    case 3:
                        deviceAttributes = _a.sent();
                        if (!deviceAttributes) {
                            return [2 /*return*/, this.bad("Device ".concat(deviceID, " doesn't exist."))];
                        }
                        return [4 /*yield*/, this._productDeviceRepository.getFromDeviceID(deviceID)];
                    case 4:
                        productDevice = _a.sent();
                        if (!productDevice) {
                            return [2 /*return*/, this.bad("Device ".concat(deviceID, " hasn't been assigned to a product"))];
                        }
                        return [2 /*return*/, this.ok(__assign(__assign(__assign({}, (0, deviceToAPI_1.default)(deviceAttributes)), productDevice), { product_id: product.product_id }))];
                }
            });
        });
    };
    ProductsController.prototype.addDevice = function (productIDOrSlug, body) {
        return __awaiter(this, void 0, void 0, function () {
            var product, ids, file_1, originalname, records, deviceAttributes, incorrectPlatformDeviceIDs, existingProductDeviceIDs, invalidDeviceIds, deviceAttributeIDs, nonmemberDeviceIds, idsToCreate, createdProductDevices;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._productRepository.getByIDOrSlug(productIDOrSlug)];
                    case 1:
                        product = _a.sent();
                        if (!product) {
                            return [2 /*return*/, this.bad("".concat(productIDOrSlug, " does not exist"))];
                        }
                        ids = [];
                        if (!(body.import_method === 'many')) return [3 /*break*/, 3];
                        file_1 = body.file;
                        if (!file_1) {
                            return [2 /*return*/, this.bad('No file uploaded')];
                        }
                        originalname = file_1.originalname;
                        if (!originalname.endsWith('.txt') && !originalname.endsWith('.csv')) {
                            return [2 /*return*/, this.bad('File must be csv or txt file.')];
                        }
                        return [4 /*yield*/, new Promise(function (resolve, reject) {
                                return csv_1.default.parse(file_1.buffer.toString('utf8'), function (error, data) {
                                    if (error) {
                                        reject(error);
                                    }
                                    resolve(data);
                                });
                            })];
                    case 2:
                        records = _a.sent();
                        if (!records.length) {
                            return [2 /*return*/, this.bad("File didn't have any ids")];
                        }
                        if (records.some(function (record) { return record.length !== 1; })) {
                            return [2 /*return*/, this.bad('File should only have a single column of device ids')];
                        }
                        ids = __spreadArray([], records, true);
                        return [3 /*break*/, 4];
                    case 3:
                        if (!body.id) {
                            return [2 /*return*/, this.bad('You must pass an id for a device')];
                        }
                        ids = [body.id];
                        _a.label = 4;
                    case 4:
                        ids = ids.map(function (id) { return id.toLowerCase(); });
                        return [4 /*yield*/, this._deviceAttributeRepository.getManyFromIDs(ids)];
                    case 5:
                        deviceAttributes = _a.sent();
                        incorrectPlatformDeviceIDs = deviceAttributes
                            .filter(function (deviceAttribute) {
                            return deviceAttribute.platformId !== undefined &&
                                deviceAttribute.platformId !== product.platform_id;
                        })
                            .map(function (deviceAttribute) { return deviceAttribute.deviceID; });
                        return [4 /*yield*/, this._productDeviceRepository.getManyFromDeviceIDs(ids)];
                    case 6:
                        existingProductDeviceIDs = (_a.sent()).map(function (productDevice) { return productDevice.deviceID; });
                        invalidDeviceIds = __spreadArray(__spreadArray([], incorrectPlatformDeviceIDs, true), existingProductDeviceIDs, true);
                        deviceAttributeIDs = deviceAttributes.map(function (deviceAttribute) { return deviceAttribute.deviceID; });
                        nonmemberDeviceIds = ids.filter(function (id) { return !deviceAttributeIDs.includes(id); });
                        if (invalidDeviceIds.length) {
                            return [2 /*return*/, {
                                    data: {
                                        updated: 0,
                                        nonmemberDeviceIds: nonmemberDeviceIds,
                                        invalidDeviceIds: invalidDeviceIds,
                                    },
                                    status: 400,
                                }];
                        }
                        idsToCreate = ids.filter(function (id) {
                            return !invalidDeviceIds.includes(id) &&
                                !existingProductDeviceIDs.includes(id);
                        });
                        return [4 /*yield*/, Promise.all(idsToCreate.map(function (id) {
                                return _this._productDeviceRepository.create({
                                    denied: false,
                                    development: false,
                                    deviceID: id,
                                    lockedFirmwareVersion: null,
                                    productFirmwareVersion: 65535,
                                    productID: product.product_id,
                                    quarantined: nonmemberDeviceIds.includes(id),
                                });
                            }))];
                    case 7:
                        createdProductDevices = _a.sent();
                        // flash devices
                        createdProductDevices.forEach(function (productDevice) {
                            _this._deviceManager.flashProductFirmware(productDevice.productID, productDevice.deviceID);
                        });
                        return [2 /*return*/, this.ok({
                                updated: idsToCreate.length,
                                nonmemberDeviceIds: nonmemberDeviceIds,
                                invalidDeviceIds: invalidDeviceIds,
                            })];
                }
            });
        });
    };
    ProductsController.prototype.updateProductDevice = function (productIDOrSlug, deviceIDorName, _a) {
        var denied = _a.denied, desired_firmware_version = _a.desired_firmware_version, development = _a.development, notes = _a.notes, quarantined = _a.quarantined;
        return __awaiter(this, void 0, void 0, function () {
            var deviceID, product, productDevice, shouldFlash, output, deviceFirmwares, parsedFirmware_1, updatedProductDevice;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this._deviceManager.getDeviceID(deviceIDorName)];
                    case 1:
                        deviceID = _b.sent();
                        return [4 /*yield*/, this._productRepository.getByIDOrSlug(productIDOrSlug)];
                    case 2:
                        product = _b.sent();
                        if (!product) {
                            return [2 /*return*/, this.bad("".concat(productIDOrSlug, " does not exist"))];
                        }
                        return [4 /*yield*/, this._productDeviceRepository.getFromDeviceID(deviceID)];
                    case 3:
                        productDevice = _b.sent();
                        if (!productDevice) {
                            return [2 /*return*/, this.bad("Device ".concat(deviceID, " is not associated with a product"))];
                        }
                        shouldFlash = false;
                        output = {
                            id: productDevice.id,
                            updated_at: new Date(),
                        };
                        if (!(desired_firmware_version !== undefined)) return [3 /*break*/, 5];
                        return [4 /*yield*/, this._productFirmwareRepository.getManyByProductID(product.product_id)];
                    case 4:
                        deviceFirmwares = _b.sent();
                        parsedFirmware_1 = desired_firmware_version !== null
                            ? parseInt(desired_firmware_version.toString(), 10)
                            : null;
                        if (parsedFirmware_1 !== null &&
                            !deviceFirmwares.find(function (firmware) { return firmware.version === parsedFirmware_1; })) {
                            return [2 /*return*/, this.bad("Firmware version ".concat(parsedFirmware_1, " does not exist"))];
                        }
                        productDevice.lockedFirmwareVersion = parsedFirmware_1;
                        output = __assign(__assign({}, output), { desired_firmware_version: desired_firmware_version
                                ? parseInt(desired_firmware_version.toString(), 10)
                                : undefined });
                        shouldFlash = true;
                        _b.label = 5;
                    case 5:
                        if (notes !== undefined) {
                            productDevice.notes = notes;
                            output = __assign(__assign({}, output), { notes: notes });
                        }
                        if (development !== undefined) {
                            productDevice.development = development;
                            output = __assign(__assign({}, output), { development: development });
                        }
                        if (denied !== undefined) {
                            productDevice.denied = denied;
                            output = __assign(__assign({}, output), { denied: denied });
                        }
                        if (quarantined !== undefined) {
                            productDevice.quarantined = quarantined;
                            output = __assign(__assign({}, output), { quarantined: quarantined });
                            shouldFlash = true;
                        }
                        return [4 /*yield*/, this._productDeviceRepository.updateByID(productDevice.id, productDevice)];
                    case 6:
                        updatedProductDevice = _b.sent();
                        if (shouldFlash) {
                            this._deviceManager.flashProductFirmware(productDevice.productID, productDevice.deviceID);
                        }
                        return [2 /*return*/, this.ok(output)];
                }
            });
        });
    };
    ProductsController.prototype.removeDeviceFromProduct = function (productIDOrSlug, deviceIDorName) {
        return __awaiter(this, void 0, void 0, function () {
            var deviceID, product, productDevice;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._deviceManager.getDeviceID(deviceIDorName)];
                    case 1:
                        deviceID = _a.sent();
                        return [4 /*yield*/, this._productRepository.getByIDOrSlug(productIDOrSlug)];
                    case 2:
                        product = _a.sent();
                        if (!product) {
                            return [2 /*return*/, this.bad("".concat(productIDOrSlug, " does not exist"))];
                        }
                        return [4 /*yield*/, this._productDeviceRepository.getFromDeviceID(deviceID)];
                    case 3:
                        productDevice = _a.sent();
                        if (!productDevice) {
                            return [2 /*return*/, this.bad("Device ".concat(deviceID, " was not mapped to ").concat(productIDOrSlug))];
                        }
                        return [4 /*yield*/, this._productDeviceRepository.deleteByID(productDevice.id)];
                    case 4:
                        _a.sent();
                        return [2 /*return*/, this.ok()];
                }
            });
        });
    };
    ProductsController.prototype.getEvents = function (productIdOrSlug, eventName) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new HttpError_1.default('Not implemented');
            });
        });
    };
    ProductsController.prototype.removeTeamMember = function (productIdOrSlug, username) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new HttpError_1.default('not supported in the current server version');
            });
        });
    };
    ProductsController.prototype._formatProduct = function (product) {
        var product_id = product.product_id, output = __rest(product, ["product_id"]);
        output.id = product_id;
        return output;
    };
    __decorate([
        (0, httpVerb_1.default)('get'),
        (0, route_1.default)('/v1/products')
    ], ProductsController.prototype, "getProducts", null);
    __decorate([
        (0, httpVerb_1.default)('post'),
        (0, route_1.default)('/v1/products')
    ], ProductsController.prototype, "createProduct", null);
    __decorate([
        (0, httpVerb_1.default)('get'),
        (0, route_1.default)('/v1/products/:productIDOrSlug')
    ], ProductsController.prototype, "getProduct", null);
    __decorate([
        (0, httpVerb_1.default)('put'),
        (0, route_1.default)('/v1/products/:productIDOrSlug')
    ], ProductsController.prototype, "updateProduct", null);
    __decorate([
        (0, httpVerb_1.default)('delete'),
        (0, route_1.default)('/v1/products/:productIDOrSlug')
    ], ProductsController.prototype, "deleteProduct", null);
    __decorate([
        (0, httpVerb_1.default)('get'),
        (0, route_1.default)('/v1/products/:productIDOrSlug/config')
    ], ProductsController.prototype, "getConfig", null);
    __decorate([
        (0, httpVerb_1.default)('get'),
        (0, route_1.default)('/v1/products/:productIDOrSlug/devices')
    ], ProductsController.prototype, "getDevices", null);
    __decorate([
        (0, httpVerb_1.default)('get'),
        (0, route_1.default)('/v1/products/:productIDOrSlug/devices/:deviceIDorName')
    ], ProductsController.prototype, "getSingleDevice", null);
    __decorate([
        (0, httpVerb_1.default)('post'),
        (0, route_1.default)('/v1/products/:productIDOrSlug/devices'),
        (0, allowUpload_1.default)('file', 1)
    ], ProductsController.prototype, "addDevice", null);
    __decorate([
        (0, httpVerb_1.default)('put'),
        (0, route_1.default)('/v1/products/:productIDOrSlug/devices/:deviceIDorName')
    ], ProductsController.prototype, "updateProductDevice", null);
    __decorate([
        (0, httpVerb_1.default)('delete'),
        (0, route_1.default)('/v1/products/:productIDOrSlug/devices/:deviceIDorName')
    ], ProductsController.prototype, "removeDeviceFromProduct", null);
    __decorate([
        (0, httpVerb_1.default)('get'),
        (0, route_1.default)('/v1/products/:productIdOrSlug/events/:eventPrefix?*')
    ], ProductsController.prototype, "getEvents", null);
    __decorate([
        (0, httpVerb_1.default)('delete'),
        (0, route_1.default)('/v1/products/:productIdOrSlug/team/:username')
    ], ProductsController.prototype, "removeTeamMember", null);
    return ProductsController;
}(Controller_1.default));
exports.default = ProductsController;
/* eslint-enable */
//# sourceMappingURL=ProductsController.js.map