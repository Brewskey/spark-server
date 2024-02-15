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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var Controller_1 = __importDefault(require("./Controller"));
var HttpError_1 = __importDefault(require("../lib/HttpError"));
var httpVerb_1 = __importDefault(require("../decorators/httpVerb"));
var route_1 = __importDefault(require("../decorators/route"));
var validateWebhookMutator = function (webhookMutator) {
    if (!webhookMutator.event) {
        return new HttpError_1.default('no event name provided');
    }
    if (!webhookMutator.url) {
        return new HttpError_1.default('no url provided');
    }
    if (!webhookMutator.requestType) {
        return new HttpError_1.default('no requestType provided');
    }
    return null;
};
var WebhooksController = /** @class */ (function (_super) {
    __extends(WebhooksController, _super);
    function WebhooksController(webhookManager) {
        var _this = _super.call(this) || this;
        _this._webhookManager = webhookManager;
        return _this;
    }
    WebhooksController.prototype.getAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this.ok;
                        return [4 /*yield*/, this._webhookManager.getAll()];
                    case 1: return [2 /*return*/, _a.apply(this, [_b.sent()])];
                }
            });
        });
    };
    WebhooksController.prototype.getByID = function (webhookID) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this.ok;
                        return [4 /*yield*/, this._webhookManager.getByID(webhookID)];
                    case 1: return [2 /*return*/, _a.apply(this, [_b.sent()])];
                }
            });
        });
    };
    WebhooksController.prototype.create = function (model) {
        return __awaiter(this, void 0, void 0, function () {
            var validateError, newWebhook;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        validateError = validateWebhookMutator(model);
                        if (validateError) {
                            throw validateError;
                        }
                        return [4 /*yield*/, this._webhookManager.create(__assign(__assign({}, model), { ownerID: this.user.id }))];
                    case 1:
                        newWebhook = _a.sent();
                        return [2 /*return*/, this.ok({
                                created_at: newWebhook.created_at,
                                event: newWebhook.event,
                                id: newWebhook.id,
                                ok: true,
                                url: newWebhook.url,
                            })];
                }
            });
        });
    };
    WebhooksController.prototype.deleteByID = function (webhookID) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._webhookManager.deleteByID(webhookID)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.ok({ ok: true })];
                }
            });
        });
    };
    __decorate([
        (0, httpVerb_1.default)('get'),
        (0, route_1.default)('/v1/webhooks')
    ], WebhooksController.prototype, "getAll", null);
    __decorate([
        (0, httpVerb_1.default)('get'),
        (0, route_1.default)('/v1/webhooks/:webhookID')
    ], WebhooksController.prototype, "getByID", null);
    __decorate([
        (0, httpVerb_1.default)('post'),
        (0, route_1.default)('/v1/webhooks')
    ], WebhooksController.prototype, "create", null);
    __decorate([
        (0, httpVerb_1.default)('delete'),
        (0, route_1.default)('/v1/webhooks/:webhookID')
    ], WebhooksController.prototype, "deleteByID", null);
    return WebhooksController;
}(Controller_1.default));
exports.default = WebhooksController;
//# sourceMappingURL=WebhooksController.js.map