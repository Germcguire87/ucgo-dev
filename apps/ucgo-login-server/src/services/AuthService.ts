import { LoginResultCode } from "ucgo-core";
import type { AccountRecord, AccountRepository } from "../repositories/AccountRepository.js";
import type { SessionService } from "./SessionService.js";

export interface AuthResult {
  resultCode: number;
  /** Populated only when resultCode === LoginResultCode.SUCCESS */
  account?: AccountRecord;
}

export class AuthService {
  constructor(
    private readonly accounts: AccountRepository,
    private readonly sessions: SessionService,
  ) {}

  /**
   * Validate credentials and session constraints.
   *
   * @param username          Plaintext username from packet
   * @param password          Plaintext password (already decrypted by loginPasswordCrypto)
   * @param clientVersion     Version field from the login packet
   * @param acceptedVersion   Version the server expects (from config)
   */
  authenticate(
    username: string,
    password: string,
    clientVersion: number,
    acceptedVersion: number,
  ): AuthResult {
    if (clientVersion !== acceptedVersion) {
      return { resultCode: LoginResultCode.WRONG_VERSION };
    }

    const account = this.accounts.findByUsername(username);
    if (account === undefined || account.password !== password) {
      return { resultCode: LoginResultCode.BAD_CREDENTIALS };
    }

    if (this.sessions.isActive(account.accountId)) {
      return { resultCode: LoginResultCode.ALREADY_LOGGED_IN };
    }

    return { resultCode: LoginResultCode.SUCCESS, account };
  }
}
