"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var mongodb_1 = require("mongodb");
var deepToObjectIdCast = function (node) {
    Object.keys(node).forEach(function (key) {
        var val = node[key];
        if (val === Object(node[key])) {
            deepToObjectIdCast(val);
        }
        if (key === '_id') {
            // eslint-disable-next-line
            node[key] = new mongodb_1.ObjectId(val);
        }
    });
    return node;
};
var BaseMongoDb = /** @class */ (function () {
    function BaseMongoDb() {
        var _this = this;
        // eslint-disable-next-line no-unused-vars
        this.__filterID = function (_a) {
            var _ = _a.id, otherProps = __rest(_a, ["id"]);
            return (__assign({}, otherProps));
        };
        this.__translateQuery = function (query) {
            return _this.__filterID(deepToObjectIdCast(query !== null && query !== void 0 ? query : {}));
        };
        this.__translateResultItem = function (item) {
            if (!item) {
                return null;
            }
            var castEntity = item;
            if (castEntity._id) {
                castEntity.id = castEntity._id.toString();
                delete castEntity._id;
            }
            return item;
        };
    }
    return BaseMongoDb;
}());
exports.default = BaseMongoDb;
//# sourceMappingURL=BaseMongoDb.js.map