"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var spark_protocol_1 = require("spark-protocol");
var DeviceFirmwareFileRepository = /** @class */ (function () {
    function DeviceFirmwareFileRepository(path) {
        this._fileManager = new spark_protocol_1.FileManager(path, false);
    }
    DeviceFirmwareFileRepository.prototype.getByName = function (appName) {
        return this._fileManager.getFileBuffer("".concat(appName, ".bin"));
    };
    return DeviceFirmwareFileRepository;
}());
exports.default = DeviceFirmwareFileRepository;
//# sourceMappingURL=DeviceFirmwareFileRepository.js.map