'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _bunyan = require('bunyan');

var _bunyan2 = _interopRequireDefault(_bunyan);

var _types = require('../types');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Logger = function () {
  function Logger() {
    (0, _classCallCheck3.default)(this, Logger);
  }

  (0, _createClass3.default)(Logger, null, [{
    key: 'createLogger',
    value: function createLogger(aName) {
      return _bunyan2.default.createLogger({
        level: process.env.LOG_LEVEL !== undefined ? process.env.LOG_LEVEL : 'info',
        name: aName
      });
    }
  }, {
    key: 'createModuleLogger',
    value: function createModuleLogger(aModule) {
      return _bunyan2.default.createLogger({
        level: process.env.LOG_LEVEL !== undefined ? process.env.LOG_LEVEL : 'info',
        name: _path2.default.basename(aModule.filename)
      });
    }
  }]);
  return Logger;
}(); /**
     *    Copyright (C) 2013-2014 Spark Labs, Inc. All rights reserved. -  https://www.spark.io/
     *
     *    This program is free software: you can redistribute it and/or modify
     *    it under the terms of the GNU Affero General Public License, version 3,
     *    as published by the Free Software Foundation.
     *
     *    This program is distributed in the hope that it will be useful,
     *    but WITHOUT ANY WARRANTY; without even the implied warranty of
     *    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
     *    GNU Affero General Public License for more details.
     *
     *    You should have received a copy of the GNU Affero General Public License
     *    along with this program.  If not, see <http://www.gnu.org/licenses/>.
     *
     *    You can download the source here: https://github.com/spark/spark-server
     *
     * 
     *
     */

exports.default = Logger;