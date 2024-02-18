import crypto from 'crypto';

const CLAIM_CODE_LENGTH = 63;
const CLAIM_CODE_TTL = 5000 * 60; // 5 min

class ClaimCodeManager {
  _userIDByClaimCode: Map<string, string> = new Map();

  _timers: Map<string, NodeJS.Timeout> = new Map();

  _generateClaimCode(): string {
    return crypto
      .randomBytes(CLAIM_CODE_LENGTH)
      .toString('base64')
      .substring(0, CLAIM_CODE_LENGTH);
  }

  createClaimCode(userID: string): string {
    let claimCode = this._generateClaimCode();

    while (this._userIDByClaimCode.has(claimCode)) {
      claimCode = this._generateClaimCode();
    }

    this._userIDByClaimCode.set(claimCode, userID);

    this._timers.set(
      claimCode,
      setTimeout(
        (): boolean => this.removeClaimCode(claimCode),
        CLAIM_CODE_TTL,
      ),
    );

    return claimCode;
  }

  onShutdown(): void {
    const timers = Array.from(this._timers.values());
    timers.forEach((timer) => {
      clearTimeout(timer);
    });
    this._timers.clear();
  }

  removeClaimCode(claimCode: string): boolean {
    const timer = this._timers.get(claimCode);
    if (timer) {
      clearTimeout(timer);
    }
    this._timers.delete(claimCode);
    return this._userIDByClaimCode.delete(claimCode);
  }

  getUserIDByClaimCode(claimCode: string): string | null | undefined {
    return this._userIDByClaimCode.get(claimCode);
  }
}

export default ClaimCodeManager;
