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
Object.defineProperty(exports, "__esModule", { value: true });
var HttpError = /** @class */ (function (_super) {
    __extends(HttpError, _super);
    function HttpError(error, status) {
        if (status === void 0) { status = 400; }
        var _this = _super.call(this, error instanceof Error ? error.message : error) || this;
        if (error instanceof HttpError && typeof error.status === 'number') {
            _this.status = error.status;
        }
        else {
            _this.status = status;
        }
        return _this;
    }
    return HttpError;
}(Error));
exports.default = HttpError;
//# sourceMappingURL=HttpError.js.map