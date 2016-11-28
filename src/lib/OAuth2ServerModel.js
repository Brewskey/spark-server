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

const roles = require('./RolesController.js');

type Callback = (error: ?Error, result: mixed) => void;
type GrantType = 'password';

class OAuth2ServerModel {
  static getAccessToken(bearerToken: string, callback: Callback) {
    const token = roles.getTokenInfoByToken(bearerToken);
    callback(null, token);
  }

  static getClient(clientId: string, clientSecret: string, callback: Callback) {
    return callback(null, { client_id: clientId });
  }

  static grantTypeAllowed(clientId: string, grantType: GrantType, callback: Callback) {
    return callback(null, grantType === 'password');
  }

  static async saveAccessToken(
    accessToken: string,
    clientId: string,
    userId: string,
    expires: number,
    callback: Callback,
  ) {
    try {
      await roles.addAccessToken(accessToken, clientId, userId, expires);
    } finally {
      callback();
    }
  }

  static async getUser(username: string, password: string, callback: Callback) {
    try {
      const user = await roles.validateLogin(username, password);
      callback(null, { id: user._id });
    } catch (error) {
      callback(error, null);
    }
  }
}

export default OAuth2ServerModel;
