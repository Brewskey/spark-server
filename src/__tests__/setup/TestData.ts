import crypto from 'crypto';
import * as uuid from 'uuid';
import NodeRSA from 'node-rsa';
import fs from 'fs';
import settings from './settings';
import type { UserCredentials } from '../../types';

const uuidSet = new Set();

type CreateCustomFirmwareResult = {
  filePath: string;
  fileBuffer: Buffer;
};

class TestData {
  static createCustomFirmwareBinary: () => Promise<CreateCustomFirmwareResult> =
    (): Promise<CreateCustomFirmwareResult> =>
      new Promise(
        (
          resolve: (result: CreateCustomFirmwareResult) => void,
          reject: (error: Error) => void,
        ) => {
          const filePath = `${
            settings.CUSTOM_FIRMWARE_DIRECTORY
          }/customApp-${TestData.getID()}.bin`;
          const fileBuffer = crypto.randomBytes(100);

          fs.writeFile(filePath, fileBuffer, (error?: Error | null) => {
            if (error) {
              reject(error);
              return;
            }
            resolve({ fileBuffer, filePath });
          });
        },
      );

  static deleteCustomFirmwareBinary: (filePath: string) => Promise<void> = (
    filePath: string,
  ): Promise<void> =>
    new Promise((resolve: () => void, reject: (error: Error) => void) => {
      fs.unlink(filePath, (error?: Error | null) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });

  static getUser: () => UserCredentials = (): UserCredentials => ({
    password: 'password',
    username: `testUser+${TestData.getID()}@test.com`,
  });

  static getID: () => string = (): string => {
    let newID = uuid.v4().toLowerCase();
    while (uuidSet.has(newID)) {
      newID = uuid.v4().toLowerCase();
    }
    uuidSet.add(newID);
    return newID;
  };

  static getPublicKey: () => string = (): string => {
    const key = new NodeRSA({ b: 1024 });

    return key.exportKey('pkcs8-public-pem');
  };
}

export default TestData;
