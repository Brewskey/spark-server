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
Object.defineProperty(exports, "__esModule", { value: true });
var DEVICE_DEFAULT = {
    connected: false,
    current_build_target: -1,
    deviceID: '',
    functions: null,
    imei: '',
    ip: null,
    isCellular: false,
    last_iccid: '',
    lastFlashedAppName: null,
    lastHeard: null,
    name: '',
    particleProductId: -1,
    platformId: -1,
    productFirmwareVersion: -1,
    variables: null,
};
var deviceToAPI = function (device, result) {
    var mergedDevice = __assign(__assign({}, DEVICE_DEFAULT), device);
    return {
        cellular: mergedDevice.isCellular,
        connected: mergedDevice.connected || false,
        current_build_target: parseInt((mergedDevice.currentBuildTarget != null
            ? mergedDevice.currentBuildTarget
            : mergedDevice.current_build_target).toString()),
        functions: mergedDevice.functions || null,
        id: mergedDevice.deviceID,
        imei: mergedDevice.imei,
        last_app: mergedDevice.lastFlashedAppName,
        last_heard: mergedDevice.lastHeard,
        last_iccid: mergedDevice.last_iccid,
        last_ip_address: mergedDevice.ip,
        name: mergedDevice.name,
        platform_id: mergedDevice.platformId,
        product_firmware_version: mergedDevice.productFirmwareVersion,
        product_id: mergedDevice.particleProductId,
        return_value: result,
        status: 'normal',
        variables: mergedDevice.variables || null,
    };
};
exports.default = deviceToAPI;
//# sourceMappingURL=deviceToAPI.js.map