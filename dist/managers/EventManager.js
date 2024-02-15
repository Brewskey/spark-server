"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var EventManager = /** @class */ (function () {
    function EventManager(eventPublisher) {
        this._eventPublisher = eventPublisher;
    }
    EventManager.prototype.subscribe = function (eventNamePrefix, eventHandler, filterOptions) {
        return this._eventPublisher.subscribe(eventNamePrefix || '', eventHandler, {
            filterOptions: filterOptions,
        });
    };
    EventManager.prototype.unsubscribe = function (subscriptionID) {
        this._eventPublisher.unsubscribe(subscriptionID);
    };
    EventManager.prototype.publish = function (eventData) {
        this._eventPublisher.publish(eventData);
    };
    return EventManager;
}());
exports.default = EventManager;
//# sourceMappingURL=EventManager.js.map