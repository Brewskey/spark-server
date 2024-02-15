"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (function (httpVerb) {
    return function (target, name) {
        target[name].httpVerb = httpVerb;
    };
});
//# sourceMappingURL=httpVerb.js.map