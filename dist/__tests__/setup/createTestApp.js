"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestApp = void 0;
var app_1 = __importDefault(require("../../app"));
var settings_1 = __importDefault(require("./settings"));
var getDefaultContainer_1 = __importDefault(require("./getDefaultContainer"));
var container = (0, getDefaultContainer_1.default)();
var app = (0, app_1.default)(container, settings_1.default);
var createTestApp = function () {
    app.container = container;
    return app;
};
exports.createTestApp = createTestApp;
//# sourceMappingURL=createTestApp.js.map