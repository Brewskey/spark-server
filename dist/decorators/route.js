"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (function (route) {
    return function (target, name) {
        target[name].route = route;
    };
});
//# sourceMappingURL=route.js.map