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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var basic_auth_parser_1 = __importDefault(require("basic-auth-parser"));
var Controller_1 = __importDefault(require("./Controller"));
var HttpError_1 = __importDefault(require("../lib/HttpError"));
var anonymous_1 = __importDefault(require("../decorators/anonymous"));
var httpVerb_1 = __importDefault(require("../decorators/httpVerb"));
var route_1 = __importDefault(require("../decorators/route"));
var UsersController = /** @class */ (function (_super) {
    __extends(UsersController, _super);
    function UsersController(userRepository) {
        var _this = _super.call(this) || this;
        _this._userRepository = userRepository;
        return _this;
    }
    UsersController.prototype.createUser = function (userCredentials) {
        return __awaiter(this, void 0, void 0, function () {
            var isUserNameInUse, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this._userRepository.isUserNameInUse(userCredentials.username)];
                    case 1:
                        isUserNameInUse = _a.sent();
                        if (isUserNameInUse) {
                            throw new HttpError_1.default('user with the username already exists');
                        }
                        return [4 /*yield*/, this._userRepository.createWithCredentials(userCredentials)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, this.ok({ ok: true })];
                    case 3:
                        error_1 = _a.sent();
                        return [2 /*return*/, this.bad(error_1)];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    UsersController.prototype.deleteAccessToken = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, username, password, user;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = (0, basic_auth_parser_1.default)(this.request.get('authorization')), username = _a.username, password = _a.password;
                        return [4 /*yield*/, this._userRepository.validateLogin(username, password)];
                    case 1:
                        user = _b.sent();
                        this._userRepository.deleteAccessToken(user.id, token);
                        return [2 /*return*/, this.ok({ ok: true })];
                }
            });
        });
    };
    UsersController.prototype.getAccessTokens = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, username, password, user;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = (0, basic_auth_parser_1.default)(this.request.get('authorization')), username = _a.username, password = _a.password;
                        return [4 /*yield*/, this._userRepository.validateLogin(username, password)];
                    case 1:
                        user = _b.sent();
                        return [2 /*return*/, this.ok(user.accessTokens)];
                }
            });
        });
    };
    __decorate([
        (0, httpVerb_1.default)('post'),
        (0, route_1.default)('/v1/users'),
        (0, anonymous_1.default)()
    ], UsersController.prototype, "createUser", null);
    __decorate([
        (0, httpVerb_1.default)('delete'),
        (0, route_1.default)('/v1/access_tokens/:token'),
        (0, anonymous_1.default)()
    ], UsersController.prototype, "deleteAccessToken", null);
    __decorate([
        (0, httpVerb_1.default)('get'),
        (0, route_1.default)('/v1/access_tokens'),
        (0, anonymous_1.default)()
    ], UsersController.prototype, "getAccessTokens", null);
    return UsersController;
}(Controller_1.default));
exports.default = UsersController;
//# sourceMappingURL=UsersController.js.map