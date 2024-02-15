"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-param-reassign */
exports.default = (function (fileName, maxCount) {
    if (fileName === void 0) { fileName = null; }
    if (maxCount === void 0) { maxCount = 0; }
    return function (target, name) {
        var allowedUploads = target[name].allowedUploads || [];
        if (fileName) {
            allowedUploads.push({
                maxCount: maxCount,
                name: fileName,
            });
        }
        target[name].allowedUploads = allowedUploads;
    };
});
//# sourceMappingURL=allowUpload.js.map