import crypto from 'crypto';
import NodeRSA from 'node-rsa';

import nullthrows from 'nullthrows';

const HASH_TYPE = 'sha1';

class CryptoManager {
  _privateKey: NodeRSA;

  static _serverKey: NodeRSA | null | undefined;

  constructor(privateKey: NodeRSA) {
    this._privateKey = privateKey;
  }

  static getServerKey(): NodeRSA {
    return nullthrows(CryptoManager._serverKey);
  }

  static setServerKey(keyString: string): void {
    CryptoManager._serverKey = new NodeRSA(keyString, 'pkcs8-public-pem', {
      encryptionScheme: 'pkcs1',
      signingScheme: 'pkcs1',
      environment: 'browser',
    });
  }

  static loadPrivateKey(keyString: string): NodeRSA {
    return new NodeRSA(keyString, undefined, {
      encryptionScheme: 'pkcs1',
      signingScheme: 'pkcs1',
      environment: 'browser',
    });
  }

  static createKey(): NodeRSA {
    const rsa = new NodeRSA({
      b: 1024,
    });
    rsa.setOptions({ environment: 'browser' }); //By default it will use the node crypto library with the CVE
    return rsa;
  }

  static randomBytes(count: number): Buffer {
    return crypto.randomBytes(count);
  }

  static createHmacDigest = (
    ciphertext: Buffer,
    sessionKey: Buffer,
  ): Buffer => {
    const hmac = crypto.createHmac(HASH_TYPE, sessionKey);
    hmac.update(ciphertext);
    return hmac.digest();
  };

  encrypt(buffer: Buffer): Buffer {
    return this._privateKey.encryptPrivate(buffer);
  }
}

export default CryptoManager;
