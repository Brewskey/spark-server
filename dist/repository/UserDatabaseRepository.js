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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var BaseRepository_1 = __importDefault(require("./BaseRepository"));
var collectionNames_1 = __importDefault(require("./collectionNames"));
var PasswordHasher_1 = __importDefault(require("../lib/PasswordHasher"));
var HttpError_1 = __importDefault(require("../lib/HttpError"));
var UserDatabaseRepository = /** @class */ (function (_super) {
    __extends(UserDatabaseRepository, _super);
    function UserDatabaseRepository(database) {
        var _this = _super.call(this, database, collectionNames_1.default.USERS) || this;
        _this._collectionName = collectionNames_1.default.USERS;
        // eslint-disable-next-line no-unused-vars
        _this.create = function (user) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this._database.insertOne(this._collectionName, user)];
        }); }); };
        _this.createWithCredentials = function (userCredentials, userRole) {
            if (userRole === void 0) { userRole = null; }
            return __awaiter(_this, void 0, void 0, function () {
                var username, password, salt, passwordHash, modelToSave;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            username = userCredentials.username, password = userCredentials.password;
                            return [4 /*yield*/, PasswordHasher_1.default.generateSalt()];
                        case 1:
                            salt = _a.sent();
                            return [4 /*yield*/, PasswordHasher_1.default.hash(password, salt)];
                        case 2:
                            passwordHash = _a.sent();
                            modelToSave = {
                                accessTokens: [],
                                created_at: new Date(),
                                passwordHash: passwordHash,
                                role: userRole,
                                salt: salt,
                                username: username,
                            };
                            return [2 /*return*/, this._database.insertOne(this._collectionName, modelToSave)];
                    }
                });
            });
        };
        _this.deleteAccessToken = function (userID, accessToken) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this._database.findAndModify(this._collectionName, { _id: userID }, { $pull: { accessTokens: { accessToken: accessToken } } })];
            });
        }); };
        _this.deleteByID = function (id) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this._database.remove(this._collectionName, { _id: id })];
        }); }); };
        _this.getAll = function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new Error('The method is not implemented');
            });
        }); };
        _this.getByAccessToken = function (accessToken) { return __awaiter(_this, void 0, void 0, function () {
            var user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._database.findOne(this._collectionName, {
                            accessTokens: { $elemMatch: { accessToken: accessToken } },
                        })];
                    case 1:
                        user = _a.sent();
                        if (!!user) return [3 /*break*/, 3];
                        return [4 /*yield*/, this._database.findOne(this._collectionName, {
                                'accessTokens.accessToken': accessToken,
                            })];
                    case 2:
                        // The newer query only works on mongo so we run this for tingo.
                        user = _a.sent();
                        _a.label = 3;
                    case 3: return [2 /*return*/, user];
                }
            });
        }); };
        // eslint-disable-next-line no-unused-vars
        _this.getByID = function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new Error('The method is not implemented');
            });
        }); };
        _this.getByUsername = function (username) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this._database.findOne(this._collectionName, { username: username })];
        }); }); };
        _this.getCurrentUser = function () { return _this._currentUser; };
        _this.isUserNameInUse = function (username) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, this.getByUsername(username)];
                case 1: return [2 /*return*/, !!(_a.sent())];
            }
        }); }); };
        _this.saveAccessToken = function (userID, tokenObject) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this._database.findAndModify(this._collectionName, { _id: userID }, { $push: { accessTokens: tokenObject } })];
            });
        }); };
        _this.setCurrentUser = function (user) {
            _this._currentUser = user;
        };
        _this.updateByID = function (id, props) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this._database.findAndModify(this._collectionName, { _id: id }, { $set: __assign({}, props) })];
            });
        }); };
        _this.validateLogin = function (username, password) { return __awaiter(_this, void 0, void 0, function () {
            var user, hash;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._database.findOne(this._collectionName, {
                            username: username,
                        })];
                    case 1:
                        user = _a.sent();
                        if (!user) {
                            throw new HttpError_1.default("User doesn't exist", 404);
                        }
                        return [4 /*yield*/, PasswordHasher_1.default.hash(password, user.salt)];
                    case 2:
                        hash = _a.sent();
                        if (hash !== user.passwordHash) {
                            throw new HttpError_1.default('Wrong password');
                        }
                        return [2 /*return*/, user];
                }
            });
        }); };
        _this._database = database;
        _this.tryCreateIndex({ accessTokens: 1 });
        _this.tryCreateIndex({ 'accessTokens.accessToken': 1 });
        _this.tryCreateIndex({ username: 1 });
        return _this;
    }
    return UserDatabaseRepository;
}(BaseRepository_1.default));
exports.default = UserDatabaseRepository;
//# sourceMappingURL=UserDatabaseRepository.js.map