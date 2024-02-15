"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var constitute_1 = require("constitute");
var defaultBindings_1 = __importDefault(require("../../defaultBindings"));
var settings_1 = __importDefault(require("./settings"));
var DeviceServerMock_1 = __importDefault(require("./DeviceServerMock"));
var container = new constitute_1.Container();
// TODO - we should be creating different bindings per test so we can mock out
// different modules to test
(0, defaultBindings_1.default)(container, settings_1.default);
// settings
container.bindValue('DEVICE_DIRECTORY', settings_1.default.DEVICE_DIRECTORY);
container.bindValue('FIRMWARE_DIRECTORY', settings_1.default.FIRMWARE_DIRECTORY);
container.bindValue('SERVER_KEY_FILENAME', settings_1.default.SERVER_KEY_FILENAME);
container.bindValue('SERVER_KEYS_DIRECTORY', settings_1.default.SERVER_KEYS_DIRECTORY);
container.bindValue('USERS_DIRECTORY', settings_1.default.USERS_DIRECTORY);
container.bindValue('WEBHOOKS_DIRECTORY', settings_1.default.WEBHOOKS_DIRECTORY);
container.bindAlias('DeviceServer', DeviceServerMock_1.default);
exports.default = (function () { return container; });
//# sourceMappingURL=getDefaultContainer.js.map