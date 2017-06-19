'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _sparkProtocol = require('spark-protocol');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var EventProvider = function EventProvider(eventPublisher) {
  var _this = this;

  (0, _classCallCheck3.default)(this, EventProvider);

  this.onNewEvent = function (callback) {
    return _this._eventPublisher.subscribe(_sparkProtocol.ALL_EVENTS, callback);
  };

  this._eventPublisher = eventPublisher;
};

exports.default = EventProvider;