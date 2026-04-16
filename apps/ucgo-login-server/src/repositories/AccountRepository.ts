export interface AccountRecord {
  accountId: number;
  username: string;
  /** Plaintext password. In production this would be a hashed credential. */
  password: string;
  /** GM privilege level sent in 0x00038000. 0x0A = normal account. */
  ucgmTag: number;
}

export interface AccountRepository {
  findByUsername(username: string): AccountRecord | undefined;
  findById(accountId: number): AccountRecord | undefined;
}
