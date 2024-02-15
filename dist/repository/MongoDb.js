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
var events_1 = __importDefault(require("events"));
var mongodb_1 = require("mongodb");
var BaseMongoDb_1 = __importDefault(require("./BaseMongoDb"));
var logger_1 = __importDefault(require("../lib/logger"));
var nullthrows_1 = __importDefault(require("nullthrows"));
var spark_protocol_1 = require("spark-protocol");
var logger = logger_1.default.createModuleLogger(module);
var DB_READY_EVENT = 'dbReady';
var MongoDb = /** @class */ (function (_super) {
    __extends(MongoDb, _super);
    function MongoDb(url, options) {
        var _this = _super.call(this) || this;
        _this._statusEventEmitter = new events_1.default();
        _this.tryCreateIndex = function (collectionName, indexConfig) { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.__runForCollection(collectionName, function (collection) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, collection.createIndex(indexConfig)];
                        }); }); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); };
        _this.count = function (collectionName, query) { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, this.__runForCollection(collectionName, function (collection) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            return [2 /*return*/, collection.countDocuments(this.__translateQuery(query), {
                                    maxTimeMS: 15000,
                                })];
                        });
                    }); }) || 0];
            });
        }); };
        _this.insertOne = function (collectionName, entity) { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, this.__runForCollection(collectionName, function (collection) { return __awaiter(_this, void 0, void 0, function () {
                        var insertResult, result;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, collection.insertOne(entity)];
                                case 1:
                                    insertResult = _a.sent();
                                    return [4 /*yield*/, collection.findOne({
                                            _id: insertResult.insertedId,
                                        })];
                                case 2:
                                    result = _a.sent();
                                    return [2 /*return*/, (0, nullthrows_1.default)(this.__translateResultItem(result))];
                            }
                        });
                    }); })];
            });
        }); };
        _this.find = function (collectionName, query) { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, this.__runForCollection(collectionName, function (collection) { return __awaiter(_this, void 0, void 0, function () {
                        var _a, skip, take, otherQuery, result, resultItems;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _a = query !== null && query !== void 0 ? query : {}, skip = _a.skip, take = _a.take, otherQuery = __rest(_a, ["skip", "take"]);
                                    result = collection.find(this.__translateQuery(otherQuery), {
                                        timeout: false,
                                    });
                                    if (skip && parseInt(skip, 10) === 0) {
                                        result = result.skip(parseInt(skip, 10));
                                    }
                                    if (take && parseInt(take, 10) === 0) {
                                        result = result.limit(parseInt(take, 10));
                                    }
                                    return [4 /*yield*/, result.toArray()];
                                case 1:
                                    resultItems = _b.sent();
                                    return [2 /*return*/, resultItems
                                            .map(this.__translateResultItem)
                                            .filter(spark_protocol_1.filterFalsyValues)];
                            }
                        });
                    }); })];
            });
        }); };
        _this.findAndModify = function (collectionName, query, updateQuery) { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, this.__runForCollection(collectionName, function (collection) { return __awaiter(_this, void 0, void 0, function () {
                        var modifyResult;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, collection.findOneAndUpdate(this.__translateQuery(query), this.__translateQuery(updateQuery), { upsert: true })];
                                case 1:
                                    modifyResult = _a.sent();
                                    return [2 /*return*/, (0, nullthrows_1.default)(this.__translateResultItem(modifyResult))];
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
                                case 0: return [4 /*yield*/, collection.findOne(this.__translateQuery(query))];
                                case 1:
                                    resultItem = _a.sent();
                                    return [2 /*return*/, (0, nullthrows_1.default)(this.__translateResultItem(resultItem))];
                            }
                        });
                    }); })];
            });
        }); };
        _this.remove = function (collectionName, query) { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.__runForCollection(collectionName, function (collection) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, collection.deleteMany(this.__translateQuery(query))];
                        }); }); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); };
        _this.__runForCollection = function (collectionName, callback) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._isDbReady()];
                    case 1:
                        _a.sent();
                        // hack for flow:
                        if (!this._database) {
                            throw new Error('database is not initialized');
                        }
                        return [2 /*return*/, callback(this._database.collection(collectionName)).catch(function (error) {
                                logger.error({ collectionName: collectionName, err: error }, 'Run for Collection');
                                throw error;
                            })];
                }
            });
        }); };
        _this._init = function (url, options) { return __awaiter(_this, void 0, void 0, function () {
            var database;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, mongodb_1.MongoClient.connect(url, options)];
                    case 1:
                        database = _a.sent();
                        database.on('error', function (error) {
                            return logger.error({ err: error, options: options, url: url }, 'DB connection Error: ');
                        });
                        database.on('open', function () { return logger.info('DB connected'); });
                        database.on('close', function (str) {
                            return logger.info({ info: str }, 'DB disconnected: ');
                        });
                        this._database = database.db();
                        this._statusEventEmitter.emit(DB_READY_EVENT);
                        return [2 /*return*/];
                }
            });
        }); };
        _this._isDbReady = function () { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                if (this._database) {
                    return [2 /*return*/, Promise.resolve()];
                }
                return [2 /*return*/, new Promise(function (resolve) {
                        _this._statusEventEmitter.once(DB_READY_EVENT, function () { return resolve(); });
                    })];
            });
        }); };
        (function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._init(url, options)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); })();
        return _this;
    }
    return MongoDb;
}(BaseMongoDb_1.default));
exports.default = MongoDb;
//# sourceMappingURL=MongoDb.js.map