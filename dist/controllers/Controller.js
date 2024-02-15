"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Controller = /** @class */ (function () {
    function Controller() {
    }
    Controller.prototype.bad = function (messageOrError, status) {
        if (status === void 0) { status = 400; }
        var message = '';
        if (messageOrError instanceof Error) {
            message = messageOrError.message;
        }
        else if (typeof messageOrError === 'string') {
            message = messageOrError;
        }
        else {
            message = JSON.stringify(messageOrError);
        }
        return {
            data: {
                error: message,
                ok: false,
            },
            status: status,
        };
    };
    Controller.prototype.ok = function (output) {
        return {
            data: output,
            status: 200,
        };
    };
    return Controller;
}());
exports.default = Controller;
//# sourceMappingURL=Controller.js.map