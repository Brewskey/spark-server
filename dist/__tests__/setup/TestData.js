"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var crypto_1 = __importDefault(require("crypto"));
var uuid = __importStar(require("uuid"));
var node_rsa_1 = __importDefault(require("node-rsa"));
var fs_1 = __importDefault(require("fs"));
var settings_1 = __importDefault(require("./settings"));
var uuidSet = new Set();
var TestData = /** @class */ (function () {
    function TestData() {
    }
    TestData.createCustomFirmwareBinary = function () {
        return new Promise(function (resolve, reject) {
            var filePath = "".concat(settings_1.default.CUSTOM_FIRMWARE_DIRECTORY, "/customApp-").concat(TestData.getID(), ".bin");
            var fileBuffer = crypto_1.default.randomBytes(100);
            fs_1.default.writeFile(filePath, fileBuffer, function (error) {
                if (error) {
                    reject(error);
                    return;
                }
                resolve({ fileBuffer: fileBuffer, filePath: filePath });
            });
        });
    };
    TestData.deleteCustomFirmwareBinary = function (filePath) {
        return new Promise(function (resolve, reject) {
            fs_1.default.unlink(filePath, function (error) {
                if (error) {
                    reject(error);
                    return;
                }
                resolve();
            });
        });
    };
    TestData.getUser = function () { return ({
        password: 'password',
        username: "testUser+".concat(TestData.getID(), "@test.com"),
    }); };
    TestData.getID = function () {
        var newID = uuid.v4().toLowerCase();
        while (uuidSet.has(newID)) {
            newID = uuid.v4().toLowerCase();
        }
        uuidSet.add(newID);
        return newID;
    };
    TestData.getPublicKey = function () {
        var key = new node_rsa_1.default({ b: 1024 });
        return key.exportKey('pkcs8-public-pem');
    };
    return TestData;
}());
exports.default = TestData;
//# sourceMappingURL=TestData.js.map