/**
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
* @flow
*
*/

import { DefaultLogger } from './DefaultLogger';
import { ILogger } from '../types';
import path from 'path';

export default class Logger {
  static _logger: ILogger = new DefaultLogger('startup');
  static _LoggerClass = DefaultLogger;

  static error(...params: Array<any>) {
    Logger._logger.error(...params);
  }

  static info(...params: Array<any>) {
    Logger._logger.info(...params);
  }

  static initialize(LoggerClass: any, name: string) {
    Logger._LoggerClass = LoggerClass;
    Logger._logger = new LoggerClass(name);
    Logger.info(`Logger ${name} was created`);
  }

  static createLogger(name: string): ILogger {
    const logger = Logger._LoggerClass(name);
    Logger.info(`ChildLogger ${name} was created`);
    return logger;
  }

  static createModuleLogger(aModule: any): ILogger {
    const loggerName = path.basename(aModule.filename);
    const logger = new Logger._LoggerClass(loggerName);
    Logger.info(`ChildModuleLogger ${loggerName} was created`);
    return logger;
  }

  static log(...params: Array<any>) {
    Logger._logger.log(...params);
  }
  static warn(...params: Array<any>) {
    Logger._logger.warn(...params);
  }
}
