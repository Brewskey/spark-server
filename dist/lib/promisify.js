"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.promisify = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
var promisify = function (object, fnName) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return new Promise(function (resolve, reject) {
        return object[fnName].apply(object, __spreadArray(__spreadArray([], args, false), [function (error) {
                var callbackArgs = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    callbackArgs[_i - 1] = arguments[_i];
                }
                if (error) {
                    reject(error);
                    return null;
                }
                return callbackArgs.length <= 1
                    ? resolve.apply(void 0, callbackArgs) : resolve(callbackArgs);
            }], false));
    });
};
exports.promisify = promisify;
//# sourceMappingURL=promisify.js.map