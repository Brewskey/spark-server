"use strict";
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
var oauth2_server_1 = require("oauth2-server");
var HttpError_1 = __importDefault(require("../lib/HttpError"));
var settings_1 = __importDefault(require("../settings"));
var logger_1 = __importDefault(require("../lib/logger"));
var logger = logger_1.default.createModuleLogger(module);
var PermissionManager = /** @class */ (function () {
    function PermissionManager(deviceAttributeRepository, organizationRepository, userRepository, webhookRepository, oauthServer) {
        var _this = this;
        this._repositoriesByEntityName = new Map();
        this.checkPermissionsForEntityByID = function (entityName, id) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, this.getEntityByID(entityName, id)];
                case 1: return [2 /*return*/, !!(_a.sent())];
            }
        }); }); };
        this._organizationRepository = organizationRepository;
        this._userRepository = userRepository;
        this._repositoriesByEntityName.set('deviceAttributes', deviceAttributeRepository);
        this._repositoriesByEntityName.set('webhook', webhookRepository);
        this._oauthServer = oauthServer;
        (function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._init()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); })();
    }
    PermissionManager.prototype.getAllEntitiesForCurrentUser = function (entityName) {
        return __awaiter(this, void 0, void 0, function () {
            var currentUser;
            return __generator(this, function (_a) {
                currentUser = this._userRepository.getCurrentUser();
                return [2 /*return*/, (0, nullthrows_1.default)(this._repositoriesByEntityName.get(entityName)).getAll(currentUser.id)];
            });
        });
    };
    PermissionManager.prototype.getEntityByID = function (entityName, id) {
        return __awaiter(this, void 0, void 0, function () {
            var entity;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, nullthrows_1.default)(this._repositoriesByEntityName.get(entityName)).getByID(id)];
                    case 1:
                        entity = (_a.sent());
                        if (!entity) {
                            throw new HttpError_1.default('Entity does not exist');
                        }
                        if (!this.doesUserHaveAccess(entity)) {
                            throw new HttpError_1.default("User doesn't have access", 403);
                        }
                        return [2 /*return*/, entity];
                }
            });
        });
    };
    PermissionManager.prototype._createDefaultAdminUser = function () {
        return __awaiter(this, void 0, void 0, function () {
            var token, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this._userRepository.createWithCredentials({
                                password: settings_1.default.DEFAULT_ADMIN_PASSWORD,
                                username: settings_1.default.DEFAULT_ADMIN_USERNAME,
                            }, 'administrator')];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this._generateAdminToken()];
                    case 2:
                        token = _a.sent();
                        logger.info({ token: token }, 'New default admin user created');
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        logger.error({ err: error_1 }, 'Error during default admin user creating');
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    PermissionManager.prototype.doesUserHaveAccess = function (_a) {
        var ownerID = _a.ownerID;
        var currentUser = this._userRepository.getCurrentUser();
        return currentUser.role === 'administrator' || currentUser.id === ownerID;
    };
    PermissionManager.prototype._generateAdminToken = function () {
        return __awaiter(this, void 0, void 0, function () {
            var request, response, tokenPayload;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        request = new oauth2_server_1.Request({
                            body: {
                                client_id: 'spark-server',
                                client_secret: 'spark-server',
                                grant_type: 'password',
                                password: settings_1.default.DEFAULT_ADMIN_PASSWORD,
                                username: settings_1.default.DEFAULT_ADMIN_USERNAME,
                            },
                            headers: {
                                'content-type': 'application/x-www-form-urlencoded',
                                'transfer-encoding': 'chunked',
                            },
                            method: 'POST',
                            query: {},
                        });
                        response = new oauth2_server_1.Response({ body: {}, headers: {} });
                        return [4 /*yield*/, this._oauthServer.server.token(request, response, 
                            // oauth server doesn't allow us to use infinite access token
                            // so we pass some big value here
                            { accessTokenLifetime: 9999999999 })];
                    case 1:
                        tokenPayload = _a.sent();
                        return [2 /*return*/, tokenPayload.accessToken];
                }
            });
        });
    };
    PermissionManager.prototype._init = function () {
        return __awaiter(this, void 0, void 0, function () {
            var defaultAdminUser, organizations;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._userRepository.getByUsername(settings_1.default.DEFAULT_ADMIN_USERNAME)];
                    case 1:
                        defaultAdminUser = _a.sent();
                        if (!defaultAdminUser) return [3 /*break*/, 2];
                        logger.info({ token: defaultAdminUser.accessTokens[0].accessToken }, 'Default Admin token');
                        return [3 /*break*/, 5];
                    case 2: return [4 /*yield*/, this._createDefaultAdminUser()];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, this._userRepository.getByUsername(settings_1.default.DEFAULT_ADMIN_USERNAME)];
                    case 4:
                        defaultAdminUser = _a.sent();
                        _a.label = 5;
                    case 5: return [4 /*yield*/, this._organizationRepository.getAll()];
                    case 6:
                        organizations = _a.sent();
                        if (!(!organizations.length && defaultAdminUser)) return [3 /*break*/, 8];
                        return [4 /*yield*/, this._organizationRepository.create({
                                name: 'DEFAULT ORG',
                                user_ids: [defaultAdminUser.id],
                            })];
                    case 7:
                        _a.sent();
                        _a.label = 8;
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    return PermissionManager;
}());
exports.default = PermissionManager;
//# sourceMappingURL=PermissionManager.js.map