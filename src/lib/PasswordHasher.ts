import crypto from 'crypto';

const HASH_DIGEST = 'sha256';
const HASH_ITERATIONS = 30000;
const KEY_LENGTH = 64;

class PasswordHasher {
  static generateSalt(size: number = 64): Promise<string> {
    return new Promise(
      (resolve: (result: string) => void, reject: (error: Error) => void) => {
        crypto.randomBytes(size, (error: Error | null, buffer: Buffer) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(buffer.toString('base64'));
        });
      },
    );
  }

  static hash(password: string, salt: string): Promise<string> {
    return new Promise(
      (resolve: (result: string) => void, reject: (error: Error) => void) => {
        crypto.pbkdf2(
          password,
          salt,
          HASH_ITERATIONS,
          KEY_LENGTH,
          HASH_DIGEST,
          (error: Error | null | undefined, key: Buffer) => {
            if (error) {
              reject(error);
              return;
            }
            resolve(key.toString('base64'));
          },
        );
      },
    );
  }
}

export default PasswordHasher;
