"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var SparkCoreMock_1 = __importDefault(require("./SparkCoreMock"));
var DeviceServerMock = /** @class */ (function () {
    function DeviceServerMock() {
        this.getDevice = function () { return new SparkCoreMock_1.default(); };
    }
    return DeviceServerMock;
}());
exports.default = DeviceServerMock;
//# sourceMappingURL=DeviceServerMock.js.map