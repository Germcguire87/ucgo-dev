/**
 * Per-connection session state. One instance lives for the lifetime of a
 * single TCP connection. Mutated in-place by packet handlers.
 */
export class LoginSessionState {
  readonly connectionId: string;

  authenticated = false;

  /** Set after successful 0x00030000 authentication. */
  username?: string;
  accountId?: number;
  ucgmTag?: number;

  /** Set after 0x00030005 game server request. */
  selectedCharacterId?: number;

  /** Set to true by onClose — guards against writing to a dead socket. */
  closed = false;

  constructor(connectionId: string) {
    this.connectionId = connectionId;
  }
}
