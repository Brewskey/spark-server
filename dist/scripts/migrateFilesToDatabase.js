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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-explicit-any */
var fs_1 = __importDefault(require("fs"));
var mongodb_1 = require("mongodb");
var settings_1 = __importDefault(require("../settings"));
var NeDb_1 = __importDefault(require("../repository/NeDb"));
var MongoDb_1 = __importDefault(require("../repository/MongoDb"));
var DATABASE_TYPE = process.argv[2];
var setupDatabase = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        if (DATABASE_TYPE === 'mongo') {
            if (!settings_1.default.DB_CONFIG.URL) {
                throw new Error('You should provide mongoDB connection URL' +
                    'in settings.DB_CONFIG.URL');
            }
            return [2 /*return*/, new MongoDb_1.default(settings_1.default.DB_CONFIG.URL, settings_1.default.DB_CONFIG.OPTIONS)];
        }
        if (DATABASE_TYPE === 'nedb') {
            if (!settings_1.default.DB_CONFIG.PATH) {
                throw new Error('You should provide path to dir where NeDB will store the db files' +
                    'in settings.DB_CONFIG.PATH');
            }
            return [2 /*return*/, new NeDb_1.default(settings_1.default.DB_CONFIG.PATH)];
        }
        throw new Error('Wrong database type');
    });
}); };
var getFiles = function (directoryPath, fileExtension) {
    if (fileExtension === void 0) { fileExtension = '.json'; }
    var fileNames = fs_1.default
        .readdirSync(directoryPath)
        .filter(function (fileName) { return fileName.endsWith(fileExtension); });
    return fileNames.map(function (fileName) { return ({
        fileBuffer: fs_1.default.readFileSync("".concat(directoryPath, "/").concat(fileName)),
        fileName: fileName,
    }); });
};
var parseFile = function (file) { return JSON.parse(file.toString()); };
var mapOwnerID = function (userIDsMap) {
    return function (item) { return (__assign(__assign({}, item), { ownerID: userIDsMap.get(item.ownerID) || null })); };
};
var translateDeviceID = function (item) { return (__assign(__assign({}, item), { _id: new mongodb_1.ObjectId(item.deviceID), id: item.deviceID })); };
var filterID = function (_a) {
    var _ = _a.id, otherProps = __rest(_a, ["id"]);
    return (__assign({}, otherProps));
};
var deepDateCast = function (node) {
    Object.keys(node).forEach(function (key) {
        if (node[key] === Object(node[key])) {
            deepDateCast(node[key]);
        }
        if (!Number.isNaN(Date.parse(node[key]))) {
            // eslint-disable-next-line
            node[key] = new Date(node[key]);
        }
    });
    return node;
};
var insertItem = function (database, collectionName) {
    return function (item) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/, database.insertOne(collectionName, item)];
    }); }); };
};
var insertUsers = function (database, users) { return __awaiter(void 0, void 0, void 0, function () {
    var userIDsMap;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userIDsMap = new Map();
                return [4 /*yield*/, Promise.all(users.map(deepDateCast).map(function (user) { return __awaiter(void 0, void 0, void 0, function () {
                        var insertedUser;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, database.insertOne('users', filterID(user))];
                                case 1:
                                    insertedUser = _a.sent();
                                    userIDsMap.set(user.id, insertedUser.id);
                                    return [2 /*return*/];
                            }
                        });
                    }); }))];
            case 1:
                _a.sent();
                return [2 /*return*/, userIDsMap];
        }
    });
}); };
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var database, users, userIDsMap, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 6, , 7]);
                console.log('Setup database connection...');
                return [4 /*yield*/, setupDatabase()];
            case 1:
                database = _a.sent();
                console.log("Start migration to ".concat(DATABASE_TYPE));
                users = getFiles(settings_1.default.USERS_DIRECTORY).map(function (_a) {
                    var fileBuffer = _a.fileBuffer;
                    return parseFile(fileBuffer);
                });
                return [4 /*yield*/, insertUsers(database, users)];
            case 2:
                userIDsMap = _a.sent();
                return [4 /*yield*/, Promise.all(getFiles(settings_1.default.WEBHOOKS_DIRECTORY)
                        .map(function (_a) {
                        var fileBuffer = _a.fileBuffer;
                        return parseFile(fileBuffer);
                    })
                        .map(deepDateCast)
                        .map(mapOwnerID(userIDsMap))
                        .map(filterID)
                        .map(insertItem(database, 'webhooks')))];
            case 3:
                _a.sent();
                return [4 /*yield*/, Promise.all(getFiles(settings_1.default.DEVICE_DIRECTORY)
                        .map(function (_a) {
                        var fileBuffer = _a.fileBuffer;
                        return parseFile(fileBuffer);
                    })
                        .map(deepDateCast)
                        .map(mapOwnerID(userIDsMap))
                        .map(translateDeviceID)
                        .map(filterID)
                        .map(insertItem(database, 'deviceAttributes')))];
            case 4:
                _a.sent();
                return [4 /*yield*/, Promise.all(getFiles(settings_1.default.DEVICE_DIRECTORY, '.pub.pem')
                        .map(function (_a) {
                        var fileName = _a.fileName, fileBuffer = _a.fileBuffer;
                        return ({
                            algorithm: 'rsa',
                            deviceID: fileName.substring(0, fileName.indexOf('.pub.pem')),
                            key: fileBuffer.toString(),
                        });
                    })
                        .map(insertItem(database, 'deviceKeys')))];
            case 5:
                _a.sent();
                console.log('All files migrated to the database successfully!');
                process.exit(0);
                return [3 /*break*/, 7];
            case 6:
                error_1 = _a.sent();
                console.log(error_1);
                process.exit(1);
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); })();
//# sourceMappingURL=migrateFilesToDatabase.js.map