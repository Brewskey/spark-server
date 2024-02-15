"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var createTestApp_1 = require("./__tests__/setup/createTestApp");
afterEach(function () {
    var app = (0, createTestApp_1.createTestApp)();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    var keys = Array.from(app.container._factories.keys());
    keys.forEach(function (key) {
        var instance = app.container.constitute(key);
        if (instance === null || instance === void 0 ? void 0 : instance.onShutdown) {
            instance.onShutdown();
        }
    });
});
//# sourceMappingURL=setup-jest.js.map