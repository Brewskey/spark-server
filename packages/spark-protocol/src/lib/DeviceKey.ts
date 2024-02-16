import ECKey from 'ec-key';
import NodeRSA from 'node-rsa';

class DeviceKey {
  _ecKey: ECKey | null | undefined;

  _nodeRsa: NodeRSA | null | undefined;

  constructor(pemString: string) {
    try {
      this._nodeRsa = new NodeRSA(pemString, 'pkcs8-public-pem', {
        encryptionScheme: 'pkcs1',
        signingScheme: 'pkcs1',
      });
    } catch (_) {
      this._ecKey = new ECKey(pemString, 'pem');
    }
  }

  encrypt(data: Buffer): Buffer {
    if (this._nodeRsa) {
      return this._nodeRsa.encrypt(data);
    }
    if (this._ecKey) {
      return this._ecKey.createSign('SHA256').update(data).sign();
    }

    throw new Error(`Key not implemented ${data.toString()}`);
  }

  equals(publicKeyPem?: string | null): boolean {
    if (!publicKeyPem) {
      return false;
    }

    const otherKey = new DeviceKey(publicKeyPem);

    return this.toPem() === otherKey.toPem();
  }

  toPem(): string | null | undefined {
    if (this._nodeRsa) {
      return this._nodeRsa.exportKey('pkcs8-public-pem').toString();
    }
    if (this._ecKey) {
      return this._ecKey.toString('pem');
    }

    return null;
  }
}

export default DeviceKey;
