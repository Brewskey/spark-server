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
var fs_1 = __importDefault(require("fs"));
var mkdirp_1 = require("mkdirp");
var nedb_core_1 = __importDefault(require("nedb-core"));
var collectionNames_1 = __importDefault(require("./collectionNames"));
var promisify_1 = require("../lib/promisify");
var BaseMongoDb_1 = __importDefault(require("./BaseMongoDb"));
var nullthrows_1 = __importDefault(require("nullthrows"));
var constitute_1 = require("constitute");
var NeDb = /** @class */ (function (_super) {
    __extends(NeDb, _super);
    function NeDb(path) {
        var _this = _super.call(this) || this;
        _this.tryCreateIndex = function (collectionName, indexConfig) { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, this.__runForCollection(collectionName, function (collection) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            collection.ensureIndex(indexConfig);
                            return [2 /*return*/];
                        });
                    }); })];
            });
        }); };
        _this.count = function (collectionName, query) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.__runForCollection(collectionName, function (collection) {
                            return (0, promisify_1.promisify)(collection, 'count', query);
                        })];
                    case 1: return [2 /*return*/, (_a.sent()) || 0];
                }
            });
        }); };
        _this.insertOne = function (collectionName, entity) {
            return _this.__runForCollection(collectionName, function (collection) { return __awaiter(_this, void 0, void 0, function () {
                var insertResult;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, (0, promisify_1.promisify)(collection, 'insert', entity)];
                        case 1:
                            insertResult = _a.sent();
                            return [2 /*return*/, (0, nullthrows_1.default)(this.__translateResultItem(insertResult))];
                    }
                });
            }); });
        };
        _this.find = function (collectionName, query) { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, this.__runForCollection(collectionName, function (collection) { return __awaiter(_this, void 0, void 0, function () {
                        var skip, take, otherQuery, result, resultItems;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    skip = query.skip, take = query.take, otherQuery = __rest(query, ["skip", "take"]);
                                    result = collection.find(otherQuery);
                                    if (skip && parseInt(skip, 10) !== 0) {
                                        result = result.skip(parseInt(skip, 10));
                                    }
                                    if (take && parseInt(take, 10) !== 0) {
                                        result = result.limit(parseInt(take, 10));
                                    }
                                    return [4 /*yield*/, (0, promisify_1.promisify)(result, 'exec')];
                                case 1:
                                    resultItems = _a.sent();
                                    return [2 /*return*/, resultItems.map(this.__translateResultItem)];
                            }
                        });
                    }); })];
            });
        }); };
        _this.findAndModify = function (collectionName, query, updateQuery) { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, this.__runForCollection(collectionName, function (collection) { return __awaiter(_this, void 0, void 0, function () {
                        var _a, _count, resultItem;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0: return [4 /*yield*/, (0, promisify_1.promisify)(collection, 'update', query, updateQuery, {
                                        returnUpdatedDocs: true,
                                        upsert: true,
                                    })];
                                case 1:
                                    _a = _b.sent(), _count = _a[0], resultItem = _a[1];
                                    return [2 /*return*/, (0, nullthrows_1.default)(this.__translateResultItem(resultItem))];
                            }
                        });
                    }); })];
            });
        }); };
        _this.findOne = function (collectionName, query) { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, this.__runForCollection(collectionName, function (collection) { return __awaiter(_this, void 0, void 0, function () {
                        var resultItem;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, (0, promisify_1.promisify)(collection, 'findOne', query)];
                                case 1:
                                    resultItem = _a.sent();
                                    return [2 /*return*/, this.__translateResultItem(resultItem)];
                            }
                        });
                    }); })];
            });
        }); };
        _this.remove = function (collectionName, query) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.__runForCollection(collectionName, function (collection) {
                        return (0, promisify_1.promisify)(collection, 'remove', query);
                    })];
            });
        }); };
        _this.__runForCollection = function (collectionName, callback) { return callback(_this._database[collectionName]); };
        if (!fs_1.default.existsSync(path)) {
            mkdirp_1.mkdirp.sync(path);
        }
        _this._database = {};
        Object.values(collectionNames_1.default).forEach(function (collectionName) {
            _this._database[collectionName] = new nedb_core_1.default({
                autoload: true,
                filename: "".concat(path, "/").concat(collectionName, ".db"),
                inMemoryOnly: process.env.NODE_ENV === 'test',
            });
        });
        return _this;
    }
    NeDb.constitute = function () {
        return constitute_1.Singleton.with(['DATABASE_PATH']);
    };
    return NeDb;
}(BaseMongoDb_1.default));
exports.default = NeDb;
//# sourceMappingURL=NeDb.js.map