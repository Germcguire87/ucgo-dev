import type { AccountRecord, AccountRepository } from "./AccountRepository.js";

/**
 * Seed accounts for local development and testing.
 *
 * Credentials: all accounts use password "password".
 * ucgmTag 0x0A = normal (non-GM) account.
 */
const SEED_ACCOUNTS: AccountRecord[] = [
  // No characters — exercises the 0-character slot list path
  {
    accountId: 0x00000001,
    username:  "nochar",
    password:  "password",
    ucgmTag:   0x0a,
  },
  // One character
  {
    accountId: 0x00000002,
    username:  "onechar",
    password:  "password",
    ucgmTag:   0x0a,
  },
  // Two characters (maximum per account)
  {
    accountId: 0x00000003,
    username:  "twochars",
    password:  "password",
    ucgmTag:   0x0a,
  },
];

export class InMemoryAccountRepository implements AccountRepository {
  private readonly byUsername = new Map<string, AccountRecord>();
  private readonly byId       = new Map<number, AccountRecord>();

  constructor() {
    for (const acc of SEED_ACCOUNTS) {
      this.byUsername.set(acc.username, acc);
      this.byId.set(acc.accountId, acc);
    }
  }

  findByUsername(username: string): AccountRecord | undefined {
    return this.byUsername.get(username);
  }

  findById(accountId: number): AccountRecord | undefined {
    return this.byId.get(accountId);
  }
}
