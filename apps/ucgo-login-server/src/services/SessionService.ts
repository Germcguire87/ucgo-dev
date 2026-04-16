/**
 * Tracks which accounts are currently logged in.
 * Used by AuthService to reject duplicate logins, and by LoginConnection
 * to release the session slot on disconnect.
 */
export class SessionService {
  /** accountId → connectionId of the active connection */
  private readonly activeSessions = new Map<number, string>();

  activate(accountId: number, connectionId: string): void {
    this.activeSessions.set(accountId, connectionId);
  }

  deactivate(accountId: number): void {
    this.activeSessions.delete(accountId);
  }

  isActive(accountId: number): boolean {
    return this.activeSessions.has(accountId);
  }
}
