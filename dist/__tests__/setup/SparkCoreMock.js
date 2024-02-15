"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var SparkCoreMock = /** @class */ (function () {
    function SparkCoreMock() {
        this.onApiMessage = function () { return true; };
        this.getVariableValue = function () { return 0; };
        this.getDescription = function () { return ({
            firmware_version: '0.6.0',
            product_id: '6',
            state: {
                f: null,
                v: null,
            },
        }); };
        this.ping = function () { return ({
            connected: false,
            lastPing: new Date(),
        }); };
    }
    return SparkCoreMock;
}());
exports.default = SparkCoreMock;
//# sourceMappingURL=SparkCoreMock.js.map