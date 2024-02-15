"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var bunyan_1 = __importDefault(require("bunyan"));
var path_1 = __importDefault(require("path"));
var settings_1 = __importDefault(require("../settings"));
var Logger = /** @class */ (function () {
    function Logger() {
    }
    Logger.createLogger = function (applicationName) {
        return bunyan_1.default.createLogger({
            level: settings_1.default.LOG_LEVEL,
            name: applicationName,
            serializers: bunyan_1.default.stdSerializers,
        });
    };
    Logger.createModuleLogger = function (applicationModule) {
        return bunyan_1.default.createLogger({
            level: settings_1.default.LOG_LEVEL,
            name: path_1.default.basename(applicationModule.filename),
            serializers: bunyan_1.default.stdSerializers,
        });
    };
    return Logger;
}());
exports.default = Logger;
//# sourceMappingURL=logger.js.map