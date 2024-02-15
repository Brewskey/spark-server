"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var crypto_1 = __importDefault(require("crypto"));
var HASH_DIGEST = 'sha256';
var HASH_ITERATIONS = 30000;
var KEY_LENGTH = 64;
var PasswordHasher = /** @class */ (function () {
    function PasswordHasher() {
    }
    PasswordHasher.generateSalt = function (size) {
        if (size === void 0) { size = 64; }
        return new Promise(function (resolve, reject) {
            crypto_1.default.randomBytes(size, function (error, buffer) {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(buffer.toString('base64'));
            });
        });
    };
    PasswordHasher.hash = function (password, salt) {
        return new Promise(function (resolve, reject) {
            crypto_1.default.pbkdf2(password, salt, HASH_ITERATIONS, KEY_LENGTH, HASH_DIGEST, function (error, key) {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(key.toString('base64'));
            });
        });
    };
    return PasswordHasher;
}());
exports.default = PasswordHasher;
//# sourceMappingURL=PasswordHasher.js.map