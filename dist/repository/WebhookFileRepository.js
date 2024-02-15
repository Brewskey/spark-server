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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
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
var uuid = __importStar(require("uuid"));
var spark_protocol_1 = require("spark-protocol");
var HttpError_1 = __importDefault(require("../lib/HttpError"));
var WebhookFileRepository = /** @class */ (function () {
    function WebhookFileRepository(path) {
        var _this = this;
        this.count = function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this._fileManager.count()];
        }); }); };
        this.getAll = function (userID) {
            if (userID === void 0) { userID = null; }
            return __awaiter(_this, void 0, void 0, function () {
                var allData;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this._getAll()];
                        case 1:
                            allData = _a.sent();
                            if (userID) {
                                return [2 /*return*/, allData.filter(function (webhook) { return webhook.ownerID === userID; })];
                            }
                            return [2 /*return*/, allData];
                    }
                });
            });
        };
        // eslint-disable-next-line no-unused-vars
        this.updateByID = function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new HttpError_1.default('Not implemented');
            });
        }); };
        this._fileManager = new spark_protocol_1.JSONFileManager(path);
    }
    WebhookFileRepository.prototype.create = function (model) {
        return __awaiter(this, void 0, void 0, function () {
            var id, modelToSave;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        id = uuid.v4();
                        _a.label = 1;
                    case 1: return [4 /*yield*/, this._fileManager.hasFile("".concat(id, ".json"))];
                    case 2:
                        if (!_a.sent()) return [3 /*break*/, 3];
                        id = uuid.v4();
                        return [3 /*break*/, 1];
                    case 3:
                        modelToSave = __assign(__assign({}, model), { created_at: new Date(), id: id });
                        this._fileManager.createFile("".concat(modelToSave.id, ".json"), modelToSave);
                        return [2 /*return*/, modelToSave];
                }
            });
        });
    };
    WebhookFileRepository.prototype.deleteByID = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this._fileManager.deleteFile("".concat(id, ".json"));
                return [2 /*return*/];
            });
        });
    };
    WebhookFileRepository.prototype.getByID = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this._fileManager.getFile("".concat(id, ".json"))];
            });
        });
    };
    WebhookFileRepository.prototype._getAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this._fileManager.getAllData()];
            });
        });
    };
    return WebhookFileRepository;
}());
exports.default = WebhookFileRepository;
//# sourceMappingURL=WebhookFileRepository.js.map