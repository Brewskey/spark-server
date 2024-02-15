"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var crypto_1 = __importDefault(require("crypto"));
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var mkdirp_1 = require("mkdirp");
var rmfr_1 = __importDefault(require("rmfr"));
var child_process_1 = require("child_process");
var settings_1 = __importDefault(require("../settings"));
var logger_1 = __importDefault(require("../lib/logger"));
var logger = logger_1.default.createModuleLogger(module);
var IS_COMPILATION_ENABLED = fs_1.default.existsSync(settings_1.default.FIRMWARE_REPOSITORY_DIRECTORY);
var USER_APP_PATH = path_1.default.join(settings_1.default.FIRMWARE_REPOSITORY_DIRECTORY, 'user/applications');
var BIN_PATH = path_1.default.join(settings_1.default.BUILD_DIRECTORY, 'bin');
var MAKE_PATH = path_1.default.join(settings_1.default.FIRMWARE_REPOSITORY_DIRECTORY, 'main');
var FILE_NAME_BY_KEY = new Map();
var getKey = function () {
    return crypto_1.default.randomBytes(24).toString('hex').substring(0, 24);
};
var getUniqueKey = function () {
    var key = getKey();
    while (FILE_NAME_BY_KEY.has(key)) {
        key = getKey();
    }
    return key;
};
var FirmwareCompilationManager = /** @class */ (function () {
    function FirmwareCompilationManager() {
    }
    FirmwareCompilationManager.firmwareDirectoryExists = function () {
        return fs_1.default.existsSync(settings_1.default.FIRMWARE_REPOSITORY_DIRECTORY);
    };
    FirmwareCompilationManager.addFirmwareCleanupTask = function (appFolderPath, config) {
        var configPath = path_1.default.join(appFolderPath, 'config.json');
        if (!fs_1.default.existsSync(configPath)) {
            fs_1.default.writeFileSync(configPath, JSON.stringify(config));
        }
        var currentDate = new Date();
        var difference = new Date(config.expires_at).getTime() - currentDate.getTime();
        setTimeout(function () {
            void (0, rmfr_1.default)(appFolderPath);
        }, difference);
    };
    var _a;
    _a = FirmwareCompilationManager;
    FirmwareCompilationManager.getBinaryForID = function (id) {
        if (!_a.firmwareDirectoryExists()) {
            return null;
        }
        var binaryPath = path_1.default.join(BIN_PATH, id);
        if (!fs_1.default.existsSync(binaryPath)) {
            return null;
        }
        var binFileName = fs_1.default
            .readdirSync(binaryPath)
            .find(function (file) { return file.endsWith('.bin'); });
        if (!binFileName) {
            return null;
        }
        return fs_1.default.readFileSync(path_1.default.join(binaryPath, binFileName));
    };
    FirmwareCompilationManager.compileSource = function (platformID, files) { return __awaiter(void 0, void 0, void 0, function () {
        var platformName, appFolder, appPath, id, binPath, makeProcess, errors, sizeInfo, date, config;
        return __generator(_a, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!_a.firmwareDirectoryExists()) {
                        return [2 /*return*/, null];
                    }
                    platformName = {
                        '0': 'Core',
                        '10': 'Electron',
                        '103': 'Bluz',
                        '6': 'Photon',
                        '8': 'P1',
                        '88': 'Duo',
                    }[platformID];
                    if (!platformName) {
                        return [2 /*return*/, null];
                    }
                    platformName = platformName.toLowerCase();
                    appFolder = "".concat(platformName, "_firmware_").concat(new Date().getTime()).toLowerCase();
                    appPath = path_1.default.join(USER_APP_PATH, appFolder);
                    mkdirp_1.mkdirp.sync(appPath);
                    files.forEach(function (file) {
                        var fileName = file.originalname;
                        var fileExtension = path_1.default.extname(fileName);
                        var iterator = 0;
                        var combinedPath = path_1.default.join(appPath, fileName);
                        while (fs_1.default.existsSync(combinedPath)) {
                            combinedPath = path_1.default.join(appPath, "".concat(path_1.default.basename(fileName, fileExtension)) +
                                "_".concat(iterator++).concat(fileExtension));
                        }
                        fs_1.default.writeFileSync(combinedPath, file.buffer);
                    });
                    id = getUniqueKey();
                    binPath = path_1.default.join(BIN_PATH, id);
                    makeProcess = (0, child_process_1.spawn)('make', [
                        "APP=".concat(appFolder),
                        "PLATFORM_ID=".concat(platformID),
                        "TARGET_DIR=".concat(path_1.default.relative(MAKE_PATH, binPath).replace(/\\/g, '/')),
                    ], { cwd: MAKE_PATH });
                    errors = [];
                    makeProcess.stderr.on('data', function (data) {
                        logger.error({ data: data }, 'Error from MakeProcess');
                        errors.push("".concat(data));
                    });
                    sizeInfo = 'not implemented';
                    makeProcess.stdout.on('data', function (data) {
                        var output = "".concat(data);
                        if (output.includes('text\t')) {
                            sizeInfo = output;
                        }
                    });
                    return [4 /*yield*/, new Promise(function (resolve) {
                            makeProcess.on('exit', function () { return resolve(); });
                        })];
                case 1:
                    _b.sent();
                    date = new Date();
                    date.setDate(date.getDate() + 1);
                    config = {
                        binary_id: id,
                        errors: errors,
                        // expire in one day
                        expires_at: date,
                        // TODO: this variable has a bunch of extra crap including file names.
                        // we should filter out the string to only show the file sizes
                        sizeInfo: sizeInfo,
                    };
                    _a.addFirmwareCleanupTask(appPath, config);
                    return [2 /*return*/, config];
            }
        });
    }); };
    return FirmwareCompilationManager;
}());
if (IS_COMPILATION_ENABLED) {
    // Delete all expired binaries or queue them up to eventually be deleted.
    if (!fs_1.default.existsSync(settings_1.default.BUILD_DIRECTORY)) {
        mkdirp_1.mkdirp.sync(settings_1.default.BUILD_DIRECTORY);
    }
    if (!fs_1.default.existsSync(BIN_PATH)) {
        mkdirp_1.mkdirp.sync(BIN_PATH);
    }
    fs_1.default.readdirSync(USER_APP_PATH).forEach(function (file) {
        var appFolder = path_1.default.join(USER_APP_PATH, file);
        var configPath = path_1.default.join(appFolder, 'config.json');
        if (!fs_1.default.existsSync(configPath)) {
            return;
        }
        var configString = fs_1.default.readFileSync(configPath, 'utf8');
        if (!configString) {
            return;
        }
        var config = JSON.parse(configString);
        if (config.expires_at < new Date()) {
            // TODO - clean up artifacts in the firmware folder. Every binary will have
            // files in firmare/build/target/user & firmware/build/target/user-part
            // It might make the most sense to just create a custom MAKE file to do this
            (0, rmfr_1.default)(configPath);
            (0, rmfr_1.default)(path_1.default.join(BIN_PATH, config.binary_id));
        }
        else {
            FirmwareCompilationManager.addFirmwareCleanupTask(appFolder, config);
        }
    });
}
exports.default = FirmwareCompilationManager;
//# sourceMappingURL=FirmwareCompilationManager.js.map