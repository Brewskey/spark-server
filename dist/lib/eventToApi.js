"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var eventToApi = function (event) { return ({
    coreid: event.deviceID || null,
    data: event.data || null,
    published_at: event.publishedAt,
    ttl: event.ttl || 0,
}); };
exports.default = eventToApi;
//# sourceMappingURL=eventToApi.js.map